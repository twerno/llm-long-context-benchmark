import z from "zod";
import { ITaskConfigSchema as ITasksConfigSchema, ZConfigSchema, ZLlamaRunnerSchema, ZQuizBenchmarkConfigSchema } from "../app/configSchema";

export type IConfig = z.infer<typeof ZConfigSchema>;
export type ILLMConfigMap = IConfig['llms_config'];
export type IBenchmarkConfigMap = IConfig['benchmarks_config'];
export type ITaskConfigList = IConfig['tasks_config'];

export type ILlamaRunner = z.infer<typeof ZLlamaRunnerSchema>
export type IBenchmarkTasksConfig = z.infer<typeof ITasksConfigSchema>;
// export type IRunnerDefinition = z.infer<typeof ZRunnerDefinitionSchema>;

export type IBenchmarkType = z.infer<typeof ZQuizBenchmarkConfigSchema>['benchmark_type']

export interface IBenchmarkTaskConfig {
    taskName: string;
    runIdx: number,
    benchmark_llm: string;
    evaluation_llm: string;
    benchmark: string;
    evaluationRuns: number
}