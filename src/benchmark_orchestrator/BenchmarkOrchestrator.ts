import path from "node:path";
import DatasetQuizBenchmarkTask from "../benchmark_orchestrator_task/DatasetQuizBenchmarkTask";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import FileUtils from "../utils/FileUtils";
import { IGlobalConfig, IGlobalTestDef, IInternalTestConfigWrapper } from "./configTypes";
import { IBenchmarkTask } from "./IBenchmarkTask";

export interface OrchestratorOptions {
    tasks: IInternalTestConfigWrapper[];
    globalConfigs: IGlobalConfig;
    testId?: string; // Katalog główny wyników
}

export class BenchmarkOrchestrator {
    private rootDir!: string;
    private benchmarkResults: IBeanchmarkResult[] = []

    constructor(private options: OrchestratorOptions) { }

    async run(): Promise<void> {
        this.benchmarkResults = []

        // 2. Setup root directory
        this.rootDir = path.join("tmp", this.options.testId || `${new Date().toISOString().replace(/[:.]/g, "_")}`);
        FileUtils.createDirectorySafe(this.rootDir);

        console.log(`Starting benchmark session: ${this.rootDir}`);

        // 3. Iterate through tests
        for (const testConfig of this.options.tasks) {
            try {
                await this.runTest(testConfig);
            }
            catch (err) {
                console.error(err)
            }
        }

        // --- PERSIST EVALUATION RESULTS ---
        const resultsCombinedByType = this.benchmarkResults
            .reduce((prev, curr) => ({
                ...prev,
                [curr.benchmark_type]: [...(prev[curr.benchmark_type] ?? []), ...curr.results]
            }), {} as Record<string, IBenchmarkResult[]>)
        Object.entries(resultsCombinedByType)
            .forEach(([key, val]) => FileUtils.saveAsCsv(this.rootDir, `${key}.csv`, val));
    }

    private async runTest(testConfigWrapper: IInternalTestConfigWrapper): Promise<void> {
        const testName = this.getTestName(testConfigWrapper);
        const testHomeDir = path.join(this.rootDir, testConfigWrapper.test);
        const testDir = path.join(this.rootDir, testConfigWrapper.test, testName);

        FileUtils.createDirectorySafe(testDir);
        console.log(`[START] Running test: ${testName}`);

        const testConfig = this.getTestConfig(testConfigWrapper);

        for (let i = 0; i < testConfigWrapper.runs; i++) {
            const iterationId = `iteration_${i + 1}`;
            const iterationDir = path.join(testDir, iterationId);

            // 4. Check for Resume/Checkpointing
            if (FileUtils.directoryExist(iterationDir)) {
                console.log(`[SKIP] Test ${testName} already exists in ${iterationDir}. Skipping.`);
                continue;
            }
            FileUtils.createDirectorySafe(iterationDir);
            const runId = `${testName}_${iterationId}`
            try {
                const task: IBenchmarkTask = this.getBenchmarkTask(testConfig, runId, testHomeDir, iterationDir)

                // --- BENCHMARK STEP ---
                const benchmarkLLMRunner = await this.getLLMRunner(testConfigWrapper.benchmark_llm);
                try {
                    console.log(`  [${iterationId}] Running benchmark...`);
                    await task.run(benchmarkLLMRunner)
                } finally {
                    await this.cleanupLLMRunner(benchmarkLLMRunner);
                }

                // --- EVALUATION STEP ---
                const evalRunner = await this.getLLMRunner(testConfigWrapper.evaluation_llm);
                try {
                    console.log(`  [${iterationId}] Running evaluation...`);
                    await task.evaluate(evalRunner)
                } finally {
                    await this.cleanupLLMRunner(evalRunner);
                }

                // --- PERSIST EVALUATION RESULTS ---
                const evaluationResults = await task.getEvaluationResults()
                const runResults = this.saveResults(testConfigWrapper, i + 1, iterationDir, runId, evaluationResults, undefined);
                this.benchmarkResults.push(runResults);
            } catch (err) {
                console.error(err)
                const runResults = this.saveResults(testConfigWrapper, i + 1, iterationDir, runId, undefined, err);
                this.benchmarkResults.push(runResults);
                FileUtils.writeFile(iterationDir, "error.txt", `error\n` + JSON.stringify(err, null, 2))
            }
        }

        const combinedResults = this.benchmarkResults
            .filter(v => v.benchmrk_run_name === testName && v.benchmark_type === testConfigWrapper.test)
            .reduce((prev, curr) => [...prev, ...curr.results], [] as IBenchmarkResult[])
        FileUtils.saveAsCsv(testHomeDir, `results.csv`, combinedResults);
        console.log(`[FINISH] Completed test: ${this.getTestName(testConfigWrapper)}`);
    }

    private async getLLMRunner(definition: string): Promise<IManageableLLMRunner> {
        // Resolve definition to actual runner instance

        const runnerSpec = this.options.globalConfigs.global_llms[definition];
        if (!runnerSpec)
            throw new Error(`Not Found runnerId="${definition}"`)

        // Instantiate runner based on type
        if (runnerSpec.type === "llamacpp") {
            const runner = new LlamaServerRunner(runnerSpec);
            await runner.start();
            return runner;
        } else if (runnerSpec.type === "openAICompatible") {
            return new ManageableLLMRunnerWrapper(runnerSpec.url);
        }

        throw new Error(`Unknown runner type: ${JSON.stringify(runnerSpec)}`);
    }

    private async cleanupLLMRunner(runner: IManageableLLMRunner): Promise<void> {
        // Only stop if it's a manageable runner (like LlamaServerRunner)
        if (typeof runner.stop === "function") {
            await runner.stop();
        }
    }

    private getTestName(testConfig: IInternalTestConfigWrapper): string {
        const testName = testConfig.name ?? `${testConfig.benchmark_llm}__${testConfig.test}__${testConfig.runs}`
        if (!this.benchmarkResults.find(v => v.benchmrk_run_name === testName && v.benchmark_type === testConfig.test)) {
            return testName;
        }

        return `${testName}_${new Date().toISOString().replace(/[:.]/g, "_")}`
    }

    private getTestConfig(testConfigWrapper: IInternalTestConfigWrapper): IGlobalTestDef {
        const testConfig = this.options.globalConfigs.global_test_definitions[testConfigWrapper.test];
        if (!testConfig)
            throw new Error(`Unknown testId: ${JSON.stringify(testConfigWrapper.test)}`);
        return testConfig;
    }

    private getBenchmarkTask(testConfig: IGlobalTestDef, runId: string, testDir: string, iterationDir: string): IBenchmarkTask {
        if (testConfig.benchmark_type === "dataset_quiz") {
            return new DatasetQuizBenchmarkTask({
                homeDir: testDir,
                iterationDir,
                runId,
                params: testConfig.params
            })
        }
        throw new Error(`unknown benchmarkType "${testConfig.benchmark_type}"`)
    }

    private saveResults(testConfigWrapper: IInternalTestConfigWrapper, iteration: number, iterationDir: string, runId: string, taskResults: {}[] | undefined, run_error: unknown | undefined): IBeanchmarkResult {

        const testMetadata: IBenchmarkResult = {
            benchmark_lmm: testConfigWrapper.benchmark_llm,
            evaluation_lmm: testConfigWrapper.evaluation_llm,
            test_type: testConfigWrapper.test,
            test_name: this.getTestName(testConfigWrapper),
            runId,
            iteration,
            run_error,
        }

        const safeTaskResults = !taskResults || (taskResults.length == 0)
            ? [testMetadata]
            : taskResults.map(record => ({ ...testMetadata, ...record }));

        FileUtils.saveAsCsv(iterationDir, `results.csv`, safeTaskResults);

        return {
            benchmrk_run_name: testMetadata.test_name,
            benchmark_type: testMetadata.test_type,
            error: run_error,
            results: safeTaskResults
        };
    }
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