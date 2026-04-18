import fs from 'fs';
import { ZConfigSchema } from './configSchema';
import { IBenchmarkConfigMap, IBenchmarkTaskConfig, IBenchmarkTasksConfig, IConfig, ILLMConfigMap } from './configType';


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
        const taskNameMap: Record<string, number> = {}

        for (const taskDef of rawConfig.tasks_config) {
            ConfigLoader.buildTasks(taskDef, taskNameMap)
                .forEach(task => tasks.push(task))
        }

        return { tasks, llmMap, benchmarkMap };
    }

    private static buildTasks(benchmarkConfig: IBenchmarkTasksConfig, tasksNames: Record<string, number>): IBenchmarkTaskConfig[] {
        const benchmarks = benchmarkConfig.benchmarks instanceof Array
            ? benchmarkConfig.benchmarks
            : [benchmarkConfig.benchmarks]

        const result: IBenchmarkTaskConfig[] = [];
        for (const benchmark of benchmarks) {
            for (let i = 0; i < benchmarkConfig.runs; i++) {
                const taskName = `${benchmark}_${benchmarkConfig.benchmark_llm}`;
                const idx = tasksNames[taskName] ?? 0;

                result.push({
                    benchmark,
                    benchmark_llm: benchmarkConfig.benchmark_llm,
                    evaluation_llm: benchmarkConfig.evaluation_llm,
                    taskName: `${taskName}_${idx}`,
                    evaluationRuns: benchmarkConfig.evaluation_runs
                })

                tasksNames[taskName] = idx + 1;
            }
        }
        return result
    }
}
