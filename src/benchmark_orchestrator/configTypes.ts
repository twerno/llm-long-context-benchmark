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
    executablePath: z.string(),
    modelPath: z.string(),
    host: z.string().default("127.0.0.1").optional(),
    port: z.number().default(5000).optional(),

    // Parametry modelu (można rozszerzyć w przyszłości)
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    ctxSize: z.number().nonnegative().optional(),
    extraFlags: z.array(z.string()).optional()
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
    testType: z.literal("dataset_quiz"),

    params: ZQuizTestParams
})

const TestConfigSchema = z.union([QuizTestConfigSchema])

export const ITestConfigWraperSchema = z.object({
    name: z.string().optional(),
    benchmarkRunner: z.string(),
    evaluationRunner: z.string(),
    runs: z.number().int().positive().default(1),
    test: z.string()
});


/**
 * Główny schemat konfiguracji całego benchmarku
 */
const ZSpec = z.union([OpenAICompatibleSchema, LlamaRunnerSchema])

export const BenchmarkConfigSchema = z.object({
    global_llms: z.record(z.string(), ZSpec),
    global_test_definions: z.record(z.string(), TestConfigSchema),
    tests: z.array(ITestConfigWraperSchema),
});

export type IBenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;
export type ITestConfigWraperSchema = z.infer<typeof ITestConfigWraperSchema>;
export type ITestConfigSchema = z.infer<typeof TestConfigSchema>
export type ISpec = z.infer<typeof ZSpec>