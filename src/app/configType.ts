import z from "zod";
import { IBenchmarkRunConfigSchema, ZConfigSchema, ZLlamaRunnerSchema, ZRunnerDefinitionSchema } from "../app/configSchema";

export type IConfig = z.infer<typeof ZConfigSchema>;
export type IGlobalLLMMap = IConfig['global_llms'];
export type IGlobalTestDefMap = IConfig['global_test_definitions'];
export type IGlobalTestDef = IConfig['global_test_definitions'][string];

export type IGlobalConfig = {
    global_llms: IGlobalLLMMap;
    global_test_definitions: IGlobalTestDefMap;
};

// export type IOpenAiCompatible = z.infer<typeof ZOpenAiCompatibleSchema>
// export type ITestConfig = z.infer<typeof ZBenchmarkConfigSchema>;
// export type ISpec = z.infer<typeof ZSpecSchema>;
export type ILlamaRunner = z.infer<typeof ZLlamaRunnerSchema>
export type IBenchmarkConfig = z.infer<typeof IBenchmarkRunConfigSchema>;
export type IRunnerDefinition = z.infer<typeof ZRunnerDefinitionSchema>;

/**
 * Internal representation of a single test after expansion
 */
export interface IInternalTestConfigWrapper {
    name: string;
    benchmark_llm: string;
    evaluation_llm: string;
    runs: number;
    test: string;
}