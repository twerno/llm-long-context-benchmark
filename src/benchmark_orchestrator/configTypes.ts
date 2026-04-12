import { z } from "zod";

/**
 * Typy dla Runnerów LLM
 */

export const OpenAICompatibleSchema = z.object({
    type: z.literal("openAICompatible"),
    url: z.string().url(),
});

export type IOpenAICompatible = z.infer<typeof OpenAICompatibleSchema>

export const LlamaRunnerSchema = z.object({
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

export type ILlamaRunnerSchema = z.infer<typeof LlamaRunnerSchema>

export const RunnerDefinitionSchema = z.union([
    z.string(),              // Odwołanie do globalnej listy
    OpenAICompatibleSchema,  // Definicja inline LM Studio
    LlamaRunnerSchema,       // Definicja inline Llama
]);

export type IRunnerDefinition = z.infer<typeof RunnerDefinitionSchema>;

/**
 * Typy dla Testów
 */

export const TestTypeEnum = z.enum([
    "hidden_phrase",
    "sequence_numbers",
    "dataset_quiz"
]);


export const ZQuizTestParams = z.object({
    datasetSetSize: z.number().positive(),
    questionsSetSize: z.number().positive(),
    evaluationStepRuns: z.number().positive()
})

export const QuizTestConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz"),

    params: ZQuizTestParams
})

const TestConfigSchema = z.union([QuizTestConfigSchema])

export const ITestConfigWrapperSchema = z.object({
    name: z.string().optional(),
    benchmark_llm: z.string(),
    evaluation_llm: z.string(),
    runs: z.number().int().positive().default(1),
    test: z.string()
});


/**
 * Główny schemat konfiguracji całego benchmarku
 */
const ZSpec = z.union([OpenAICompatibleSchema, LlamaRunnerSchema])

export const BenchmarkConfigSchema = z.object({
    global_llms: z.record(z.string(), ZSpec),
    global_test_definitions: z.record(z.string(), TestConfigSchema),
    tests: z.array(ITestConfigWrapperSchema),
});

export type IBenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;
export type ITestConfigWrapperSchema = z.infer<typeof ITestConfigWrapperSchema>;
export type ITestConfigSchema = z.infer<typeof TestConfigSchema>
export type ISpec = z.infer<typeof ZSpec>