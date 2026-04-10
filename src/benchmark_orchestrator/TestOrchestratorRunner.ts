import fs from "node:fs/promises";
import path from "node:path";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import { BenchmarkConfig, BenchmarkConfigSchema, IOpenAICompatible, ILlamaRunnerSchema, IRunnerDefinition, TestConfig } from "./configTypes";
import { IBenchmarkTask } from "./IBenchmarkTask";
import DatasetQuizBenchmarkTask from "../benchmarks/datasetTest/DatasetQuizBenchmarkTask";
import FileUtils from "../utils/FileUtils";

export interface OrchestratorOptions {
    configPath: string;
    testId?: string; // Katalog główny wyników
}

export class TestOrchestratorRunner {
    private config!: BenchmarkConfig;
    private rootDir!: string;

    constructor(private options: OrchestratorOptions) { }

    async run(): Promise<void> {
        // 1. Load and validate config
        const configFileContent = await fs.readFile(this.options.configPath, "utf-8");
        this.config = BenchmarkConfigSchema.parse(JSON.parse(configFileContent));

        // 2. Setup root directory
        this.rootDir = this.options.testId || `benchmark_${new Date().toISOString().replace(/[:.]/g, "_")}`;
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

    private async runTest(testConfig: TestConfig): Promise<void> {
        const testName = this.getTestName(testConfig);
        const testDir = path.join(this.rootDir, testName);

        FileUtils.createDirectorySafe(testDir);
        console.log(`[START] Running test: ${testName}`);

        for (let i = 0; i < testConfig.repeats; i++) {
            const iterationId = `iteration_${i}`;
            const iterationDir = path.join(testDir, iterationId);

            // 4. Check for Resume/Checkpointing
            if (FileUtils.directoryExist(iterationDir)) {
                console.log(`[SKIP] Test ${testName} already exists in ${iterationDir}. Skipping.`);
                continue;
            }
            FileUtils.createDirectorySafe(iterationDir);
            const runId = `${testName}_${i + 1}`
            const task: IBenchmarkTask = this.getBenchmarkTask(testConfig, runId, testDir, iterationDir)

            // --- BENCHMARK STEP ---
            const benchmarkLLMRunner = await this.getLLMRunner(testConfig.benchmarkRunner);
            try {
                console.log(`  [Iteration ${i}] Running benchmark...`);
                await task.run(benchmarkLLMRunner)
                // TODO: Actual test execution logic (will need to map testType to actual test implementation)
                // const result = await executeTestStep(testConfig, benchmarkRunner, iterationDir);
                // await fs.writeFile(path.join(iterationDir, "benchmark_result.json"), JSON.stringify(result));
            } finally {
                await this.cleanupLLMRunner(benchmarkLLMRunner);
            }

            // --- EVALUATION STEP ---
            const evalRunner = await this.getLLMRunner(testConfig.evaluationRunner);
            try {
                console.log(`  [Iteration ${i}] Running evaluation...`);
                await task.run(evalRunner)
                // TODO: Actual evaluation logic
                // const evalResult = await executeEvalStep(testConfig, evalRunner, iterationDir);
                // await fs.writeFile(path.join(iterationDir, "eval_result.json"), JSON.stringify(evalResult));
            } finally {
                await this.cleanupLLMRunner(evalRunner);
            }
            await task.saveEvaluationResults()
        }

        console.log(`[FINISH] Completed test: ${this.getTestName(testConfig)}`);
    }

    private async getLLMRunner(definition: IRunnerDefinition): Promise<IManageableLLMRunner> {
        // Resolve definition to actual runner instance
        let runnerSpec: IOpenAICompatible | ILlamaRunnerSchema;

        if (typeof definition === "string") {
            const runner = this.config.global_llms.find(m => m.id === definition);
            if (!runner)
                throw new Error(`Not Founr runnerId="${definition}"`)
            runnerSpec = runner;
        } else {
            runnerSpec = definition;
        }

        // Instantiate runner based on type
        if (runnerSpec.type === "llamarunner") {
            const runner = new LlamaServerRunner({
                executablePath: runnerSpec.executablePath,
                modelPath: runnerSpec.modelPath,
                host: runnerSpec.host,
                port: runnerSpec.port,
            });
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

    private getTestName(testConfig: TestConfig): string {
        return `${testConfig.testType}_${testConfig.name}`;
    }

    private getBenchmarkTask(testConfig: TestConfig, runId: string, testDir: string, iterationDir: string): IBenchmarkTask {
        if (testConfig.testType === "dataset_quiz") {
            return new DatasetQuizBenchmarkTask({
                homeDir: testDir,
                iterationDir,
                runId,
                quizParams: { datasetSize: 2, setsOfQuestions: 1 },
                evaluationParams: { noOfEvaluationRepeats: 2 }
            })
        }
        return null as any;
    }
}
