import { z } from "zod";

// ==========================
// LLM_RUNNER
// ==========================

export const ZOpenAiCompatibleSchema = z.object({
    type: z.literal("openAICompatible"),
    url: z.url(),
});

export const ZOfflineRunnerSchema = z.object({
    type: z.literal("offline"),
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

const ZLlmRunnerSpecSchema = z.union([ZOpenAiCompatibleSchema, ZLlamaRunnerSchema, ZOfflineRunnerSchema])

// ==========================
// BENCHMARK
// ==========================

export const ZQuizTestParamsSchema = z.object({
    dataset_set_size: z.number().positive(),
    questions_set_size: z.number().positive()
})

export const ZQuizBenchmarkConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz"),

    params: ZQuizTestParamsSchema
})

export const ZHiddenPhrasesParamsSchema = z.object({
    text_length: z.number().positive(),
    no_of_hidden_phrases: z.number().positive()
})

export const ZHiddenPhrasesBenchmarkConfigSchema = z.object({
    benchmark_type: z.literal("hidden_phrase"),

    params: ZHiddenPhrasesParamsSchema
})

export const ZBenchmarkConfigSchema = z.union([ZQuizBenchmarkConfigSchema, ZHiddenPhrasesBenchmarkConfigSchema])

// ==========================
// TASK
// ==========================

export const ITaskConfigSchema = z.object({
    benchmark_llm: z.string(),
    evaluation_llm: z.string(),
    runs: z.number().int().positive().default(1),
    evaluation_runs: z.number().positive(),
    benchmarks: z.union([z.string(), z.array(z.string())])
});


// ==========================
// CONFIG
// ==========================

export const ZConfigSchema = z.object({
    llms_config: z.record(z.string(), ZLlmRunnerSpecSchema),
    benchmarks_config: z.record(z.string(), ZBenchmarkConfigSchema),
    tasks_config: z.array(ITaskConfigSchema),
});

