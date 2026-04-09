import fs from "node:fs/promises";
import path from "node:path";
import { IManageableLLMRunner } from "../llmRunner/ILLMRunner";
import { LlamaServerRunner, ManageableLLMRunnerWrapper } from "../llmRunner/LlamaServerRunner";
import { BenchmarkConfig, BenchmarkConfigSchema, IOpenAICompatible, ILlamaRunnerSchema, IRunnerDefinition, TestConfig } from "./types";

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
        await fs.mkdir(this.rootDir, { recursive: true });

        console.log(`Starting benchmark session: ${this.rootDir}`);

        // 3. Iterate through tests
        for (const testConfig of this.config.tests) {
            await this.runTest(testConfig);
        }
    }

    private async runTest(testConfig: TestConfig): Promise<void> {
        const testDir = path.join(this.rootDir, this.getTestName(testConfig));

        await fs.mkdir(testDir, { recursive: true });
        console.log(`[START] Running test: ${this.getTestName(testConfig)}`);

        for (let i = 0; i < testConfig.repeats; i++) {
            const iterationId = `iteration_${i}`;
            const iterationDir = path.join(testDir, iterationId);

            // 4. Check for Resume/Checkpointing
            try {
                const stats = await fs.stat(iterationDir);
                if (stats.isDirectory()) {
                    console.log(`[SKIP] Test ${this.getTestName(testConfig)} already exists in ${iterationDir}. Skipping.`);
                    return;
                }
            } catch (e) {
                // Directory doesn't exist, proceed
            }

            await fs.mkdir(iterationDir, { recursive: true });

            // --- BENCHMARK STEP ---
            const benchmarkRunner = await this.getRunner(testConfig.benchmarkRunner);
            try {
                console.log(`  [Iteration ${i}] Running benchmark...`);
                // TODO: Actual test execution logic (will need to map testType to actual test implementation)
                // const result = await executeTestStep(testConfig, benchmarkRunner, iterationDir);
                // await fs.writeFile(path.join(iterationDir, "benchmark_result.json"), JSON.stringify(result));
            } finally {
                await this.cleanupRunner(benchmarkRunner);
            }

            // --- EVALUATION STEP ---
            const evalRunner = await this.getRunner(testConfig.evaluationRunner);
            try {
                console.log(`  [Iteration ${i}] Running evaluation...`);
                // TODO: Actual evaluation logic
                // const evalResult = await executeEvalStep(testConfig, evalRunner, iterationDir);
                // await fs.writeFile(path.join(iterationDir, "eval_result.json"), JSON.stringify(evalResult));
            } finally {
                await this.cleanupRunner(evalRunner);
            }
        }

        console.log(`[FINISH] Completed test: ${this.getTestName(testConfig)}`);
    }

    private async getRunner(definition: IRunnerDefinition): Promise<IManageableLLMRunner> {
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

    private async cleanupRunner(runner: IManageableLLMRunner): Promise<void> {
        // Only stop if it's a manageable runner (like LlamaServerRunner)
        if (typeof runner.stop === "function") {
            await runner.stop();
        }
    }

    private getTestName(testConfig: TestConfig): string {
        return `${testConfig.testType}_${new Date().getTime()}`; // Placeholder
    }
}
