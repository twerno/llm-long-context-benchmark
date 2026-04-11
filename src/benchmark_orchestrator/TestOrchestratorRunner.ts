import fs from "node:fs/promises";
import path from "node:path";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import { IBenchmarkConfig, BenchmarkConfigSchema, ITestConfigWraperSchema, ITestConfigSchema, ISpec } from "./configTypes";
import { IBenchmarkTask } from "./IBenchmarkTask";
import DatasetQuizBenchmarkTask from "../benchmarks/datasetTest/DatasetQuizBenchmarkTask";
import FileUtils from "../utils/FileUtils";

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

    private async runTest(testConfigWraper: ITestConfigWraperSchema): Promise<void> {
        const testName = this.getTestName(testConfigWraper);
        const testDir = path.join(this.rootDir, testName);

        FileUtils.createDirectorySafe(testDir);
        console.log(`[START] Running test: ${testName}`);

        const testConfig = this.getTestConfig(testConfigWraper);

        for (let i = 0; i < testConfigWraper.runs; i++) {
            const iterationId = `iteration_${i + 1}`;
            const iterationDir = path.join(testDir, iterationId);
            try {

                // 4. Check for Resume/Checkpointing
                if (FileUtils.directoryExist(iterationDir)) {
                    console.log(`[SKIP] Test ${testName} already exists in ${iterationDir}. Skipping.`);
                    continue;
                }
                FileUtils.createDirectorySafe(iterationDir);
                const runId = `${testName}_${iterationId}`
                const task: IBenchmarkTask = this.getBenchmarkTask(testConfig, runId, testDir, iterationDir)

                // --- BENCHMARK STEP ---
                const benchmarkLLMRunner = await this.getLLMRunner(testConfigWraper.benchmarkRunner);
                try {
                    console.log(`  [${iterationId}] Running benchmark...`);
                    await task.run(benchmarkLLMRunner)
                    // await fs.writeFile(path.join(iterationDir, "benchmark_result.json"), JSON.stringify(result));
                } finally {
                    await this.cleanupLLMRunner(benchmarkLLMRunner);
                }

                // --- EVALUATION STEP ---
                const evalRunner = await this.getLLMRunner(testConfigWraper.evaluationRunner);
                try {
                    console.log(`  [${iterationId}] Running evaluation...`);
                    await task.evaluate(evalRunner)
                    // await fs.writeFile(path.join(iterationDir, "eval_result.json"), JSON.stringify(evalResult));
                } finally {
                    await this.cleanupLLMRunner(evalRunner);
                }
                await task.saveEvaluationResults()
            } catch (err) {
                console.error(err)
                FileUtils.writeFile(iterationDir, "error.txt", `error\n` + JSON.stringify(err, null, 2))
            }
        }

        console.log(`[FINISH] Completed test: ${this.getTestName(testConfigWraper)}`);
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

    private getTestName(testConfig: ITestConfigWraperSchema): string {
        return testConfig.name ?? `${testConfig.benchmarkRunner}__${testConfig.test}`
    }

    private getTestConfig(testConfigWraper: ITestConfigWraperSchema): ITestConfigSchema {
        const testConfig = this.config.global_test_definions[testConfigWraper.test];
        if (!testConfig)
            throw new Error(`Unknown testId: ${JSON.stringify(testConfigWraper.test)}`);
        return testConfig;
    }

    private getBenchmarkTask(testConfig: ITestConfigSchema, runId: string, testDir: string, iterationDir: string): IBenchmarkTask {
        if (testConfig.testType === "dataset_quiz") {
            return new DatasetQuizBenchmarkTask({
                homeDir: testDir,
                iterationDir,
                runId,
                params: testConfig.params
            })
        }
        return null as any;
    }
}
