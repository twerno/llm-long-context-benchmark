import { z } from "zod";

export const ZOpenAiCompatibleSchema = z.object({
    type: z.literal("openAICompatible"),
    url: z.url(),
});

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

export const ZRunnerDefinitionSchema = z.union([
    z.string(),              // Odwołanie do globalnej listy
    ZOpenAiCompatibleSchema,  // Definicja inline LM Studio
    ZLlamaRunnerSchema,       // Definicja inline Llama
]);

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

export const ZQuizBenchmarkConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz"),

    params: ZQuizTestParamsSchema
})

const ZBenchmarkConfigSchema = z.union([ZQuizBenchmarkConfigSchema])

export const IBenchmarkRunConfigSchema = z.object({
    name: z.string().optional(),
    benchmark_llm: z.string(),
    evaluation_llm: z.string(),
    runs: z.number().int().positive().default(1),
    test: z.union([z.string(), z.array(z.string())])
});


/**
 * Główny schemat konfiguracji całego benchmarku
 */
const ZSpecSchema = z.union([ZOpenAiCompatibleSchema, ZLlamaRunnerSchema])

export const ZConfigSchema = z.object({
    global_llms: z.record(z.string(), ZSpecSchema),
    global_test_definitions: z.record(z.string(), ZBenchmarkConfigSchema),
    benchmarks: z.array(IBenchmarkRunConfigSchema),
});

