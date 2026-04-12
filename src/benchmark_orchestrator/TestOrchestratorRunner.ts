import fs from "node:fs/promises";
import path from "node:path";
import DatasetQuizBenchmarkTask from "../benchmark_orchestrator_task/DatasetQuizBenchmarkTask";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import FileUtils from "../utils/FileUtils";
import { BenchmarkConfigSchema, IBenchmarkConfig, ITestConfigSchema, ITestConfigWrapperSchema } from "./configTypes";
import { IBenchmarkTask } from "./IBenchmarkTask";

export interface OrchestratorOptions {
    configPath: string;
    testId?: string; // Katalog główny wyników
}

export class TestOrchestratorRunner {
    private config!: IBenchmarkConfig;
    private rootDir!: string;

    constructor(private options: OrchestratorOptions) { }

    async run(): Promise<void> {
        // 1. Load and validate config
        const configFileContent = await fs.readFile(this.options.configPath, "utf-8");
        this.config = BenchmarkConfigSchema.parse(JSON.parse(configFileContent));

        // 2. Setup root directory
        this.rootDir = path.join("tmp", this.options.testId || `${new Date().toISOString().replace(/[:.]/g, "_")}`);
        FileUtils.createDirectorySafe(this.rootDir);

        console.log(`Starting benchmark session: ${this.rootDir}`);

        // 3. Iterate through tests
        for (const testConfig of this.config.tests) {
            try {
                await this.runTest(testConfig);
            }
            catch (err) {
                console.error(err)
            }
        }
    }

    private async runTest(testConfigWrapper: ITestConfigWrapperSchema): Promise<void> {
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
                    // await fs.writeFile(path.join(iterationDir, "benchmark_result.json"), JSON.stringify(result));
                } finally {
                    await this.cleanupLLMRunner(benchmarkLLMRunner);
                }

                // --- EVALUATION STEP ---
                const evalRunner = await this.getLLMRunner(testConfigWrapper.evaluation_llm);
                try {
                    console.log(`  [${iterationId}] Running evaluation...`);
                    await task.evaluate(evalRunner)
                    // await fs.writeFile(path.join(iterationDir, "eval_result.json"), JSON.stringify(evalResult));
                } finally {
                    await this.cleanupLLMRunner(evalRunner);
                }
                const taskResults = await task.getEvaluationResults()
                this.saveResults(testConfigWrapper, iterationDir, runId, taskResults, undefined);
            } catch (err) {
                console.error(err)
                this.saveResults(testConfigWrapper, iterationDir, runId, undefined, err);
                FileUtils.writeFile(iterationDir, "error.txt", `error\n` + JSON.stringify(err, null, 2))
            }
        }

        console.log(`[FINISH] Completed test: ${this.getTestName(testConfigWrapper)}`);
    }

    private async getLLMRunner(definition: string): Promise<IManageableLLMRunner> {
        // Resolve definition to actual runner instance

        const runnerSpec = this.config.global_llms[definition];
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

    private getTestName(testConfig: ITestConfigWrapperSchema): string {
        return testConfig.name ?? `${testConfig.benchmark_llm}__${testConfig.test}`
    }

    private getTestConfig(testConfigWrapper: ITestConfigWrapperSchema): ITestConfigSchema {
        const testConfig = this.config.global_test_definitions[testConfigWrapper.test];
        if (!testConfig)
            throw new Error(`Unknown testId: ${JSON.stringify(testConfigWrapper.test)}`);
        return testConfig;
    }

    private getBenchmarkTask(testConfig: ITestConfigSchema, runId: string, testDir: string, iterationDir: string): IBenchmarkTask {
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

    private saveResults(testConfigWrapper: ITestConfigWrapperSchema, iterationDir: string, runId: string, taskResults: {}[] | undefined, run_error: unknown | undefined) {

        const testMetadata = {
            benchmark_lmm: testConfigWrapper.benchmark_llm,
            evaluation_lmm: testConfigWrapper.evaluation_llm,
            test_type: testConfigWrapper.test,
            test_name: this.getTestName(testConfigWrapper),
            runId,
            iteration: 1,
            run_error: run_error,
        }

        const safeTaskResults = !taskResults || (taskResults?.length == 0)
            ? [testMetadata]
            : taskResults.map(record => ({ ...testMetadata, ...record }));

        try {
            const csvRows = safeTaskResults
                .map(record => Object.values(record)
                    .map(v => JSON.stringify(v))
                    .map(v => v && v.replace(/;/g, "_"))
                    .join(";")
                )

            const headers = Object.keys(safeTaskResults[0])
                .map(header => JSON.stringify(header))
                .map(v => v && v.replace(/;/g, "_"))
                .join(";")

            const body = headers + "\n" + csvRows.join("\n")
            FileUtils.writeFile(iterationDir, `results.csv`, body)
        } catch (err) {
            console.log(err)
        }

    }
}
