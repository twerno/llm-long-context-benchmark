import path from "node:path";
import { IConfigLoaderResult } from "../app/ConfigLoader";
import { IBenchmarkConfigMap, IBenchmarkTaskConfig } from "../app/configType";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { DummyLLMRunner, LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
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

    constructor(private options: OrchestratorOptions) { }

    async run(): Promise<void> {

        // 1. Setup root directory
        this.rootDir = path.join(this.options.rootDir ?? "tmp", this.options.testId || `${new Date().toISOString().replace(/[:.]/g, "_")}`);
        FileUtils.createDirectorySafe(this.rootDir);

        console.log(`Starting benchmark session: ${this.rootDir}`);

        const taskSummaryList: ITaskSummary[] = []

        // 2. Iterate through tests
        for (const task of this.options.config.tasks) {
            try {
                const taskSummary = await this.runTask(task);
                if (taskSummary)
                    taskSummaryList.push(taskSummary)
            }
            catch (err) {
                console.error(err)
            }
        }

        // 3. write summary
        this.buildAndSaveSummary(taskSummaryList)
    }

    private async runTask(task: IBenchmarkTaskConfig): Promise<ITaskSummary | null> {
        const { benchmarkRunId: taskName, taskId } = task;
        const { benchmarkRunHomeDir, benchmarkHomeDir, benchmarkDataBuilderProps, runnerProps, benchmarkLlmRunner, evaluationLlmRunner } = this.prepareTask(task);

        const resultFilename = `${taskId}.csv`

        if (FileUtils.fileExist(benchmarkHomeDir, resultFilename)) {
            console.log(`[SKIPPING] Test already done: "${taskName}" iteration: ${task.runIdx + 1}/${task.runTotal}`);
            return null;
        }

        // get benchmark test data
        const testDataList = await this.getBenchmarkData(benchmarkRunHomeDir, benchmarkDataBuilderProps, task);

        // build benchmark runner
        const runner = await buildBenchmarkRunner(benchmarkDataBuilderProps, runnerProps)

        console.log(`[START] Running task: "${taskName}" iteration: ${task.runIdx + 1}/${task.runTotal}`);

        // execute test
        const testResults = await this.runTests(testDataList, runner, benchmarkLlmRunner)

        // evaluate results
        const evaluationResults = await this.evaluateAnswers(testResults, runner, evaluationLlmRunner);

        // build summary
        const summary = await this.buildTaskSummary(task, benchmarkDataBuilderProps, evaluationResults, runner);
        FileUtils.saveAsCsv(benchmarkHomeDir, resultFilename, summary);

        console.log(`[DONE] Running task: "${taskName}" iteration: ${task.runIdx + 1}/${task.runTotal}`);

        return { task, summary };
    }

    private getLLMRunner(llmConfigName: string): IManageableLLMRunner {
        // Resolve definition to actual runner instance
        const config = this.options.config.llmMap[llmConfigName]

        if (!config)
            throw new Error(`Not Found llm config="${llmConfigName}"`)

        switch (config.type) {
            case "llamacpp": return new LlamaServerRunner(config);
            case "openAICompatible": return new ManageableLLMRunnerWrapper(config.url);
            case "offline": return new DummyLLMRunner()
        }
    }

    private prepareTask(task: IBenchmarkTaskConfig) {

        // task directory
        const benchmarkHomeDir = path.join(this.rootDir, FileUtils.toSafeFilename(task.benchmark));
        const benchmarkRunHomeDir = path.join(benchmarkHomeDir, task.benchmarkRunId);
        const taskLogDir = path.join(benchmarkRunHomeDir, "logs", task.taskId);

        // benchmark test builder properties
        const benchmarkDataBuilderProps = this.options.config.benchmarkMap[task.benchmark]

        // llm runners
        const benchmarkLlmRunner = this.getLLMRunner(task.benchmark_llm);
        const evaluationLlmRunner = this.getLLMRunner(task.evaluation_llm);

        // benchmark properties
        const runnerProps: IBenchmarkRunnerConfig = {
            benchmarkType: benchmarkDataBuilderProps.benchmark_type,
            evaluationRuns: task.evaluationRuns,
            logDir: taskLogDir
        }

        return { benchmarkDataBuilderProps, runnerProps, benchmarkLlmRunner, evaluationLlmRunner, benchmarkHomeDir, benchmarkRunHomeDir }
    }

    private async getBenchmarkData(benchmarkHomeDir: string, benchmarkProps: IConfigLoaderResult['benchmarkMap'][string], task: IBenchmarkTaskConfig): Promise<ITestData[]> {
        const dataDir = path.join(benchmarkHomeDir, `data`)

        if (FileUtils.fileExist(dataDir, `test_data.json`)) {
            const raw = FileUtils.readFile(dataDir, `test_data.json`);
            return JSON.parse(raw)
        }
        const data = await buildBenchmarkData(dataDir, benchmarkProps)
        FileUtils.writeFile(dataDir, `test_data.json`, JSON.stringify(data, null, 2))
        return data;
    }

    private async runTests(testDataList: ITestData[], benchmarkRunner: IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>, llmRunner: IManageableLLMRunner) {

        const testResults: Array<{ testData: ITestData, testRunResult: ITestRunData | IRunError }> = []

        try {
            await llmRunner.start();

            for (const testData of testDataList) {
                try {
                    console.log(`--- testing ${testData.testIdx}`)
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
                console.log(`--- evaluating ${testData.testIdx}`)
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

    private async buildTaskSummary(task: IBenchmarkTaskConfig, benchmarkProps: IBenchmarkConfigMap[string], results: IEvaluationResult[], benchmarkRunner: IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>): Promise<object[]> {
        const summaryList: object[] = []
        for (const { testData, testRunResult, evaluationResult } of results) {
            const metadata = {
                ...task,
                ...benchmarkProps
            }
            const summary = await benchmarkRunner.extractDataToCsv(testData, testRunResult, evaluationResult);
            summaryList.push({ ...metadata, ...summary });
        }

        return summaryList;
    }


    private buildAndSaveSummary(taskSummaryList: ITaskSummary[]) {
        const groupByBenchmarkType: Record<string, object[]> = {}

        for (const taskSummary of taskSummaryList) {
            let benchmarkType: string = this.options.config.benchmarkMap[taskSummary.task.benchmark].benchmark_type
            benchmarkType = FileUtils.toSafeFilename(benchmarkType);
            const group = groupByBenchmarkType[benchmarkType] ?? []
            group.push(...taskSummary.summary);
            groupByBenchmarkType[benchmarkType] = group
        }

        for (const [benchmarkType, rows] of Object.entries(groupByBenchmarkType)) {
            FileUtils.saveAsCsv(this.rootDir, `${benchmarkType}.csv`, rows)
        }
    }

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

type ITaskSummary = {
    task: IBenchmarkTaskConfig,
    summary: object[]
}