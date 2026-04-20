import fs from 'fs';
import { ZConfigSchema } from './configSchema';
import { IBenchmarkConfigMap, IBenchmarkTaskConfig, IBenchmarkTasksConfig, IConfig, ILLMConfigMap } from './configType';
import FileUtils from '../utils/FileUtils';


export interface IConfigLoaderResult {
    tasks: IBenchmarkTaskConfig[];
    llmMap: ILLMConfigMap;
    benchmarkMap: IBenchmarkConfigMap;
}

export class ConfigLoader {

    public static readFile(configPath: string): IConfig {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        return ZConfigSchema.parse(JSON.parse(fileContent));
    }

    public static load(rawConfig: IConfig): IConfigLoaderResult {
        const llmMap = rawConfig.llms_config
        const benchmarkMap = rawConfig.benchmarks_config

        const tasks: IBenchmarkTaskConfig[] = [];
        const benchmarkRunIds: Record<string, number> = {}

        for (const taskDef of rawConfig.tasks_config) {
            ConfigLoader.buildTasks(taskDef, benchmarkRunIds)
                .forEach(task => tasks.push(task))
        }

        return { tasks, llmMap, benchmarkMap };
    }

    private static buildTasks(benchmarkConfig: IBenchmarkTasksConfig, benchmarkRunIds: Record<string, number>): IBenchmarkTaskConfig[] {
        const benchmarks = benchmarkConfig.benchmarks instanceof Array
            ? benchmarkConfig.benchmarks
            : [benchmarkConfig.benchmarks]

        const benchmarkLlms = benchmarkConfig.benchmark_llm instanceof Array
            ? benchmarkConfig.benchmark_llm
            : [benchmarkConfig.benchmark_llm]

        const result: IBenchmarkTaskConfig[] = [];
        for (const benchmark of benchmarks) {
            for (const benchmark_llm of benchmarkLlms) {

                const benchmarkRunId = this.buildBenchmarkRunId(benchmark, benchmark_llm, benchmarkRunIds);
                for (let i = 0; i < benchmarkConfig.runs; i++) {

                    result.push({
                        benchmark,
                        benchmarkRunId: FileUtils.toSafeFilename(benchmarkRunId),
                        runIdx: i,
                        runTotal: benchmarkConfig.runs,
                        benchmark_llm,
                        evaluation_llm: benchmarkConfig.evaluation_llm,
                        taskId: FileUtils.toSafeFilename(`${benchmarkRunId}__${i}`),
                        evaluationRuns: benchmarkConfig.evaluation_runs
                    })

                }
            }

        }
        return result
    }

    private static buildBenchmarkRunId(benchmark: string, benchmark_llm: string, benchmarkRunIds: Record<string, number>) {
        const baseName = FileUtils.toSafeFilename(`${benchmark}__${benchmark_llm}`);
        const idx = benchmarkRunIds[baseName] ?? 1;
        benchmarkRunIds[baseName] = idx + 1;

        return `${baseName}__${idx}`
    }
}
