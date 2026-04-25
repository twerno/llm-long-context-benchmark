export interface ILLMRunnerProps {
    messages: {
        role: "user" | "system" | "assistant";
        content: string;
    }[]
}

export interface ILLMRunnerOutput {
    output: {
        llmReasoning?: string,
        llmAnswer: string
    };
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    totalTime: number;
}

export interface ILLMRunner {
    run: (props: ILLMRunnerProps) => Promise<ILLMRunnerOutput>;
}

export interface IManageableLLMRunner extends ILLMRunner {
    start: () => Promise<void>;
    stop: () => Promise<void>;
}