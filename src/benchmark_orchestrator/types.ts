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
    type: z.literal("llamarunner"),
    executablePath: z.string(),
    modelPath: z.string(),
    host: z.string().default("127.0.0.1"),
    port: z.number().default(5000),
    // Parametry modelu (można rozszerzyć w przyszłości)
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
});

export type ILlamaRunnerSchema = z.infer<typeof LlamaRunnerSchema>

export const LMStudioRunnerSchemaWithId = OpenAICompatibleSchema.extend({ id: z.string() })
export const LlamaRunnerSchemaWithId = LlamaRunnerSchema.extend({ id: z.string() })

export const RunnerDefinitionSchema = z.union([
    z.string(),                         // Odwołanie do globalnej listy
    OpenAICompatibleSchema,               // Definicja inline LM Studio
    LlamaRunnerSchema,                  // Definicja inline Llama
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

export const TestConfigSchema = z.object({
    testType: TestTypeEnum,
    params: z.record(z.any(), z.any()), // Parametry specyficzne dla testu (np. textLength)
    repeats: z.number().int().positive().default(1),
    benchmarkRunner: RunnerDefinitionSchema,
    evaluationRunner: RunnerDefinitionSchema,
});

/**
 * Główny schemat konfiguracji całego benchmarku
 */

export const BenchmarkConfigSchema = z.object({
    global_llms: z.array(z.union([LMStudioRunnerSchemaWithId, LlamaRunnerSchemaWithId])),
    tests: z.array(TestConfigSchema),
});

export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;
export type TestConfig = z.infer<typeof TestConfigSchema>;
