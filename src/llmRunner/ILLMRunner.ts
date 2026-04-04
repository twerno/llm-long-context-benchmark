export interface ILLMRunnerProps {
    prompt: string[]
}

export interface ILLMRunnerOutput {
    output: string[],
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    totalTime: number
}

export interface ILLMRunner {
    run: (props: ILLMRunnerProps) => Promise<ILLMRunnerOutput>
}