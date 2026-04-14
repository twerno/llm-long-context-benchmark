import { z } from 'zod';
import type { ILLMRunner, ILLMRunnerOutput, ILLMRunnerProps } from './ILLMRunner';

type IChatCompletionRequestSchema = {
    model?: string,
    messages: Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
    }>
}

const ZChatCompletionResponseSchema = z.object({
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

export class OpenAICompatibleApiLlmRunner implements ILLMRunner {
    private CHAT_PATH: string = "/v1/chat/completions";

    public constructor(private host: string) {
    }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {

        const { messages } = props;

        const request: IChatCompletionRequestSchema = {
            messages
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
            const end = performance.now();

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error: ${errorData}`);
            }

            const data = ZChatCompletionResponseSchema.parse(await response.json());

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

export const LMStudioApiRunner = new OpenAICompatibleApiLlmRunner('http://127.0.0.1:1234');