import type { ILLMRunnerProps, ILLMRunnerOutput, ILLMRunner } from './ILLMRunner';
import { z } from 'zod';

type ChatCompletionRequestSchema = {
    model?: string,
    messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
    }>
}
const ErrorResponseSchema = z.object({
    error: z.object({
        message: z.string(),
        type: z.string(),
        param: z.string(),
        code: z.string()
    })
});

const ChatCompletionResponseSchema = z.object({
    id: z.string(),
    object: z.string(),
    created: z.number(),
    model: z.string(),
    choices: z.array(z.object({
        index: z.number(),
        message: z.object({
            role: z.string(),
            content: z.string()
        }),
        finish_reason: z.string()
    })),
    usage: z.object({
        prompt_tokens: z.number(),
        completion_tokens: z.number(),
        total_tokens: z.number()
    })
});

interface OpenApiApiRunnerProps {
    model?: string
    // top_p
    // top_k
    // messages
    // temperature
    // max_tokens
    // stream
    // stop
    // presence_penalty
    // frequency_penalty
    // logit_bias
    // repeat_penalty
    // seed
}

export class OpenApiApiRunner implements ILLMRunner {

    public constructor(private apiUrl: string, private props?: OpenApiApiRunnerProps) {

    }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {

        const { prompt } = props;

        const request: ChatCompletionRequestSchema = {
            ...this.props,

            messages: prompt.map((text) => ({
                role: 'user',
                content: text
            }))
        }

        try {
            const start = performance.now();

            const response = await fetch(this.apiUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X_Session': Math.random().toString()
                    },
                    body: JSON.stringify(request)
                });
            const end = performance.now();

            if (!response.ok) {
                const errorData = ErrorResponseSchema.parse(await response.json());
                throw new Error(`API Error: ${errorData.error.message}`);
            }

            const data = ChatCompletionResponseSchema.parse(await response.json());

            const output = data.choices.map((choice) => choice.message.content);

            return {
                output,
                completionTokens: data.usage.completion_tokens,
                promptTokens: data.usage.prompt_tokens,
                totalTokens: data.usage.total_tokens,
                totalTime: Math.round(end - start)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to call LLM API: ${error.message}`);
            }
            throw error;
        }

    }
}

export const LMStudioApiRunner = new OpenApiApiRunner('http://127.0.0.1:1234/v1/chat/completions');
