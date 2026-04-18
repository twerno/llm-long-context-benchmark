import { z } from "zod";

// ==========================
// LLM_RUNNER
// ==========================

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

const ZLlmRunnerSpecSchema = z.union([ZOpenAiCompatibleSchema, ZLlamaRunnerSchema])

// ==========================
// BENCHMARK
// ==========================

export const ZQuizTestParamsSchema = z.object({
    datasetSetSize: z.number().positive(),
    questionsSetSize: z.number().positive()
})

export const ZQuizBenchmarkConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz"),

    params: ZQuizTestParamsSchema
})

export const ZQuiz2BenchmarkConfigSchema = z.object({
    benchmark_type: z.literal("dataset_quiz2"),

    params: z.string()
})

export const ZBenchmarkConfigSchema = z.union([ZQuizBenchmarkConfigSchema, ZQuiz2BenchmarkConfigSchema])

// ==========================
// TASK
// ==========================

export const ITaskConfigSchema = z.object({
    task_name: z.string(),
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

