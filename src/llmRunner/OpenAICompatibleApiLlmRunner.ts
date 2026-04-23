import { z } from 'zod';
import type { ILLMRunner, ILLMRunnerOutput, ILLMRunnerProps } from './ILLMRunner';

type IChatCompletionRequestSchema = {
    model?: string,
    messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
    }>,
    stream?: boolean
}

const ZChatCompletionResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(
        z.object({
            index: z.number(),
            message: z.object({
                role: z.string(),
                content: z.string()
            }),
            finish_reason: z.string().nullable()
        })
    ),
    usage: z.object({
        prompt_tokens: z.number(),
        completion_tokens: z.number(),
        total_tokens: z.number()
    }).optional()
});

const ZChatCompletionStreamResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(
        z.object({
            index: z.number(),
            delta: z.object({
                role: z.string().optional(),
                reasoning_content: z.string().optional().nullable(),
                content: z.string().optional().nullable(),
            }),
            finish_reason: z.string().nullable()
        })
    ),
    timings: z.object({
        cache_n: z.number(),
        prompt_n: z.number(),
        predicted_n: z.number(),
        predicted_ms: z.number(),
        prompt_ms: z.number()
    }).optional()
})


export class OpenAICompatibleApiLlmRunner implements ILLMRunner {
    private CHAT_PATH: string = "/v1/chat/completions";

    public constructor(private host: string) {
    }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {

        const { messages } = props;

        const request: IChatCompletionRequestSchema = {
            messages,
            stream: true
        }

        try {
            const start = performance.now();
            const response = await fetch(this.host + this.CHAT_PATH,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error: ${errorData}`);
            }

            if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
                // Fallback if not streaming (though we requested it)
                const data = ZChatCompletionResponseSchema.parse(await response.json());
                const output = data.choices.map((choice) => choice.message.content);
                return {
                    output,
                    completionTokens: data.usage?.completion_tokens ?? 0,
                    promptTokens: data.usage?.prompt_tokens ?? 0,
                    totalTokens: data.usage?.total_tokens ?? 0,
                    totalTime: Math.round(performance.now() - start)
                };
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let lines: string[] = []

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                };
                const chunk = decoder.decode(value, { stream: true });
                const tmpLines = chunk
                    .split('\n')
                    .filter(v => (v ?? "").trim().length > 0)
                    .filter(v => v.includes("chat.completion.chunk"))
                lines.push(...tmpLines)
            }

            const timings = lines.slice(-1)
                .map(l => l.substring(6).trim())
                .map(l => JSON.parse(l))
                .map(v => ZChatCompletionStreamResponseSchema.parse(v))[0]?.timings

            const chunks = lines
                .slice(0, -1)
                .map(l => l.substring(6).trim())
                .map(l => JSON.parse(l))
                .map(v => ZChatCompletionStreamResponseSchema.parse(v))
                .map(v => v.choices[0].delta.reasoning_content ?? v.choices[0].delta.content ?? "")

            const fullContent = chunks.reduce((prev, curr) => prev + curr, "")

            const completionTokens = timings?.predicted_n ?? 0
            const promptTokens = (timings?.cache_n ?? 0) + (timings?.prompt_n ?? 0)
            const totalTokens = completionTokens + promptTokens

            return {
                output: [fullContent],
                completionTokens,
                promptTokens,
                totalTokens,
                totalTime: Math.round(performance.now() - start)
            };

        } catch (error) {
            console.error(error)
            if (error instanceof Error) {
                throw new Error(`Failed to call LLM API: ${error.message}`);
            }
            throw error;
        }

    }
}

export const LMStudioApiRunner = new OpenAICompatibleApiLlmRunner('http://127.0.0.1:1234');