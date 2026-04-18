import path from "node:path";
import { IConfigLoaderResult } from "../app/ConfigLoader";
import { IBenchmarkTaskConfig } from "../app/configType";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import FileUtils from "../utils/FileUtils";
import { IAbstractBenchmarkRunner, IBenchmarkRunnerConfig, IEvaluationRunData, IRunError, ITestData, ITestRunData } from "./AbstractBenchmarkRunner";
import { buildBenchmarkData, buildBenchmarkRunner } from "./benchmarkDef";


export interface OrchestratorOptions {
    config: IConfigLoaderResult
    rootDir?: string,
    testId?: string; // Katalog główny wyników
}

export class BenchmarkOrchestrator {
    private rootDir!: string;
    private benchmarkResults: IBeanchmarkResult[] = []

    constructor(private options: OrchestratorOptions) { }

    async run(): Promise<void> {
        this.benchmarkResults = []

        // 2. Setup root directory
        this.rootDir = path.join(this.options.rootDir ?? "tmp", this.options.testId || `${new Date().toISOString().replace(/[:.]/g, "_")}`);
        FileUtils.createDirectorySafe(this.rootDir);

        console.log(`Starting benchmark session: ${this.rootDir}`);

        // 3. Iterate through tests
        for (const task of this.options.config.tasks) {
            try {
                await this.runTask(task);
            }
            catch (err) {
                console.error(err)
            }
        }

        // // --- PERSIST EVALUATION RESULTS ---
        // const resultsCombinedByType = this.benchmarkResults
        //     .reduce((prev, curr) => ({
        //         ...prev,
        //         [curr.benchmark_type]: [...(prev[curr.benchmark_type] ?? []), ...curr.results]
        //     }), {} as Record<string, IBenchmarkResult[]>)
        // Object.entries(resultsCombinedByType)
        //     .forEach(([key, val]) => FileUtils.saveAsCsv(this.rootDir, `${key}.csv`, val));
    }

    private getLLMRunner(llmConfigName: string): IManageableLLMRunner {
        // Resolve definition to actual runner instance
        const config = this.options.config.llmMap[llmConfigName]

        if (!config)
            throw new Error(`Not Found llm config="${llmConfigName}"`)

        switch (config.type) {
            case "llamacpp": return new LlamaServerRunner(config);
            case "openAICompatible": return new ManageableLLMRunnerWrapper(config.url);
        }
    }

    private prepareTask(task: IBenchmarkTaskConfig) {

        // task directory
        const benchmarkHomeDir = path.join(this.rootDir, task.benchmark);
        const taskHomeDir = path.join(benchmarkHomeDir, task.taskName);
        FileUtils.createDirectorySafe(taskHomeDir);

        // benchmark test builder properties
        const benchmarkDataBuilderProps = this.options.config.benchmarkMap[task.benchmark]

        // llm runners
        const benchmarkLlmRunner = this.getLLMRunner(task.benchmark_llm);
        const evaluationLlmRunner = this.getLLMRunner(task.evaluation_llm);

        // benchmark properties
        const runnerProps: IBenchmarkRunnerConfig = {
            benchmarkType: benchmarkDataBuilderProps.benchmark_type,
            evaluationRuns: task.evaluationRuns,
            logDir: path.join(taskHomeDir, "log")
        }

        return { benchmarkHomeDir, taskHomeDir, benchmarkDataBuilderProps, runnerProps, benchmarkLlmRunner, evaluationLlmRunner }
    }

    private async getBenchmarkData(benchmarkHomeDir: string, benchmarkProps: IConfigLoaderResult['benchmarkMap'][string]): Promise<ITestData[]> {
        const logDir = path.join(benchmarkHomeDir, "log")
        // TODO read/save
        const data = await buildBenchmarkData(logDir, benchmarkProps)
        return data;
    }

    private async runTests(testDataList: ITestData[], benchmarkRunner: IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>, llmRunner: IManageableLLMRunner) {

        const testResults: Array<{ testData: ITestData, testRunResult: ITestRunData | IRunError }> = []

        try {
            await llmRunner.start();

            for (const testData of testDataList) {
                try {
                    const testRunResult = await benchmarkRunner.runTest(llmRunner, testData)
                    testResults.push({ testData, testRunResult })
                } catch (err) {
                    console.error(err);
                    testResults.push({ testData, testRunResult: { status: "ERROR", error: (err as any)?.message ?? JSON.stringify(err) } })
                }
            }

        } catch (err) {
            console.error(err);
        }
        finally {
            await llmRunner.stop()
        }

        return testResults;
    }

    private async evaluateAnswers(answersToEvaluate: ITestRunResult[], benchmarkRunner: IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>, llmRunner: IManageableLLMRunner): Promise<IEvaluationResult[]> {
        const results: IEvaluationResult[] = []

        try {
            await llmRunner.start();

            for (const { testData, testRunResult } of answersToEvaluate) {
                if (testRunResult.status === "ERROR") {
                    results.push({ testData, testRunResult, evaluationResult: [] })
                    continue;
                }
                try {
                    const evaluationResults = await benchmarkRunner.evaluateTest(llmRunner, testData, testRunResult)
                    results.push({ testData, testRunResult, evaluationResult: evaluationResults })
                } catch (err) {
                    console.error(err);
                    results.push({ testData, testRunResult, evaluationResult: [{ status: "ERROR", error: (err as any)?.message ?? JSON.stringify(err) }] })
                }
            }

        } catch (err) {
            console.error(err);
        }
        finally {
            await llmRunner.stop()
        }

        return results;
    }

    private async buildTaskSummary(results: IEvaluationResult[], benchmarkRunner: IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>): Promise<object[]> {
        return results
            .map(({ testData, testRunResult, evaluationResult }) => benchmarkRunner.extractDataToCsv(testData, testRunResult, evaluationResult))
    }

    private async runTask(task: IBenchmarkTaskConfig): Promise<void> {
        const { taskName } = task;
        const { benchmarkHomeDir, benchmarkDataBuilderProps, runnerProps, taskHomeDir, benchmarkLlmRunner, evaluationLlmRunner } = this.prepareTask(task);

        // get benchmark test data
        const testDataList = await this.getBenchmarkData(benchmarkHomeDir, benchmarkDataBuilderProps);

        // build benchmark runner
        const runner = await buildBenchmarkRunner(benchmarkDataBuilderProps, runnerProps)

        console.log(`[START] Running task: ${taskName}`);

        // execute test
        const testResults = await this.runTests(testDataList, runner, benchmarkLlmRunner)

        // evaluate results
        const evaluationResults = await this.evaluateAnswers(testResults, runner, evaluationLlmRunner);

        // build summary
        const summary = await this.buildTaskSummary(evaluationResults, runner);
        FileUtils.saveAsCsv(benchmarkHomeDir, `${taskName}.csv`, summary);

        console.log(`[DONE] Running task: ${taskName}`);
    }








    // private saveResults(testConfigWrapper: IBenchmarkTask, iteration: number, iterationDir: string, runId: string, taskResults: {}[] | undefined, run_error: unknown | undefined): IBeanchmarkResult {

    //     const testMetadata: IBenchmarkResult = {
    //         benchmark_lmm: testConfigWrapper.benchmark_llm,
    //         evaluation_lmm: testConfigWrapper.evaluation_llm,
    //         test_type: testConfigWrapper.benchmark,
    //         test_name: this.getTestName(testConfigWrapper),
    //         runId,
    //         iteration,
    //         run_error,
    //     }

    //     const safeTaskResults = !taskResults || (taskResults.length == 0)
    //         ? [testMetadata]
    //         : taskResults.map(record => ({ ...testMetadata, ...record }));

    //     FileUtils.saveAsCsv(iterationDir, `results.csv`, safeTaskResults);

    //     return {
    //         benchmrk_run_name: testMetadata.test_name,
    //         benchmark_type: testMetadata.test_type,
    //         error: run_error,
    //         results: safeTaskResults
    //     };
    // }
}

interface IBeanchmarkResult {
    benchmark_type: string,
    benchmrk_run_name: string,
    error?: unknown,
    results: IBenchmarkResult[]
}

interface IBenchmarkResult {
    benchmark_lmm: string,
    evaluation_lmm: string,
    test_type: string,
    test_name: string,
    runId: string,
    iteration: number,
    run_error?: unknown,
}

interface ITestRunResult {
    testData: ITestData,
    testRunResult: ITestRunData | IRunError,
}

interface IEvaluationResult {
    testData: ITestData,
    testRunResult: ITestRunData | IRunError,
    evaluationResult: Array<IEvaluationRunData | IRunError>
}