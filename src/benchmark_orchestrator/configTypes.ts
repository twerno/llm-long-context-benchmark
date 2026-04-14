import { z } from "zod";

/**
 * Typy dla Runnerów LLM
 */

export const ZOpenAiCompatibleSchema = z.object({
    type: z.literal("openAICompatible"),
    url: z.url(),
});

export type IOpenAiCompatible = z.infer<typeof ZOpenAiCompatibleSchema>

export const ZLlamaRunnerSchema = z.object({
    type: z.literal("llamacpp"),
    executable_path: z.string(),
    model_path: z.string(),
    host: z.string().default("127.0.0.1").optional(),
    port: z.number().default(5000).optional(),

    // Parametry modelu (można rozszerzyć w przyszłości)
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    ctx_size: z.number().nonnegative().optional(),
    extra_flags: z.array(z.string()).optional()
});

export type ILlamaRunner = z.infer<typeof ZLlamaRunnerSchema>

export const ZRunnerDefinitionSchema = z.union([
    z.string(),              // Odwołanie do globalnej listy
    ZOpenAiCompatibleSchema,  // Definicja inline LM Studio
    ZLlamaRunnerSchema,       // Definicja inline Llama
]);

export type IRunnerDefinition = z.infer<typeof ZRunnerDefinitionSchema>;

/**
 * Typy dla Testów
 */

export const ZTestTypeEnum = z.enum([
    "hidden_phrase",
    "sequence_numbers",
    "dataset_quiz"
]);


export const ZQuizTestParamsSchema = z.object({
    datasetSetSize: z.number().positive(),
    questionsSetSize: z.number().positive(),
    evaluationStepRuns: z.number().positive()
})

export const ZQuizTestConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz"),

    params: ZQuizTestParamsSchema
})

const ZTestConfigSchema = z.union([ZQuizTestConfigSchema])

export const ITestConfigWrapperSchema = z.object({
    name: z.string().optional(),
    benchmark_llm: z.string(),
    evaluation_llm: z.string(),
    runs: z.number().int().positive().default(1),
    test: z.union([z.string(), z.array(z.string())])
});

export type ITestConfigWrapper = z.infer<typeof ITestConfigWrapperSchema>;

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

/**
 * Główny schemat konfiguracji całego benchmarku
 */
const ZSpecSchema = z.union([ZOpenAiCompatibleSchema, ZLlamaRunnerSchema])

export const ZBenchmarkConfigSchema = z.object({
    global_llms: z.record(z.string(), ZSpecSchema),
    global_test_definitions: z.record(z.string(), ZTestConfigSchema),
    tests: z.array(ITestConfigWrapperSchema),
});

export type IBenchmarkConfig = z.infer<typeof ZBenchmarkConfigSchema>;
export type IGlobalLLMMap = IBenchmarkConfig['global_llms'];
export type IGlobalTestDefMap = IBenchmarkConfig['global_test_definitions'];
export type IGlobalTestDef = IBenchmarkConfig['global_test_definitions'][string];

export type IGlobalConfig = {
    global_llms: IGlobalLLMMap;
    global_test_definitions: IGlobalTestDefMap;
};
export type ITestConfig = z.infer<typeof ZTestConfigSchema>;
export type ISpec = z.infer<typeof ZSpecSchema>;