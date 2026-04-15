import { ILLMRunner, ILLMRunnerProps } from "../llmRunner/ILLMRunner"
import FileUtils from "../utils/FileUtils"

export interface IBenchmarkRunnerConfig {
    benchmarkType: string,
    benchmarkLlm: {
        name: string,
        runner: ILLMRunner
    },
    evaluationLlm: {
        name: string,
        runner: ILLMRunner
    },
    runDir: string,
    benchmarkRuns: number,
    evaluationRuns: number
}

export interface ITestData {
    systemPrompt: string[],
    userPrompt: string[]
}

export type ITestRunData = {
    status: "OK",
    promptTokens: number,
    completionTokens: number,
    totalTime: number,
    llmAnswer: string
}

export type IEvaluationRunData = {
    status: "OK",
    evaluationResult: boolean,
    promptTokens: number,
    completionTokens: number,
    totalTime: number,
    llmAnswer: string
}

export type IRunError = {
    status: "ERROR",
    error: string
}


export interface IBenchmarkDataBuilder<T_PARAMS, T_DATA extends ITestData> {
    buildBenchmarkTestsData(params: T_PARAMS): Promise<T_DATA[]>
}



export interface IAbstractBenchmarkRunner<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> {

    runTest(data: T_DATA): Promise<T_RUN_DATA | IRunError>

    evaluateTest(data: T_DATA, testRun: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>>

    extractDataToCsv(data: T_DATA, testRun: T_RUN_DATA | IRunError, evaluations: Array<EV_DATA_RUN | IRunError>): Promise<object>
}



export abstract class AbstractBenchmarkRunner<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> implements IAbstractBenchmarkRunner<T_DATA, T_RUN_DATA, EV_DATA_RUN> {

    public constructor(protected readonly props: IBenchmarkRunnerConfig) { }

    protected abstract mapTestSuccessResponse(data: T_DATA, runData: ITestRunData): T_RUN_DATA;
    protected abstract buildEvaluationPrompt(data: T_DATA, testRunData: T_RUN_DATA): Promise<string[]>
    protected abstract internalEvaluateLlmAnswer(data: T_DATA, testRunData: T_RUN_DATA, lllAnswer: string): Promise<boolean>
    protected abstract mapEvaluationSuccessResponse(data: T_DATA, runData: ITestRunData, evaluationRunData: IEvaluationRunData): EV_DATA_RUN;

    public abstract extractDataToCsv(data: T_DATA, testRun: T_RUN_DATA | IRunError, evaluations: Array<EV_DATA_RUN | IRunError>): Promise<object>;


    public async runTest(data: T_DATA): Promise<T_RUN_DATA | IRunError> {

        try {
            const requestBody: ILLMRunnerProps = { messages: [] }
            data.systemPrompt.forEach(content => requestBody.messages.push({ role: "system", content }));
            data.userPrompt.forEach(content => requestBody.messages.push({ role: "user", content }));

            const resp = await this.sendRequest2Llm(this.props.benchmarkLlm.runner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;

            if (this.props.runDir) {
                const body = JSON.stringify({ data, llmAnswer, promptTokens, completionTokens, totalTime }, null, 2);
                FileUtils.writeFile(this.props.runDir, `test.json`, body);
            }

            return this.mapTestSuccessResponse(data, {
                status: "OK",
                llmAnswer,
                totalTime,
                promptTokens,
                completionTokens,
            })
        } catch (err) {
            console.error(err)
            return this.mapTestError(data, JSON.stringify((err as any)?.message ?? err));
        }
    }


    public async evaluateTest(data: T_DATA, testRunData: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>> {

        const result: Array<EV_DATA_RUN | IRunError> = [];
        const requestBody: ILLMRunnerProps = { messages: [] }
        const prompts = await this.buildEvaluationPrompt(data, testRunData);
        prompts.forEach(content => requestBody.messages.push({ role: "user", content }));

        for (let i = 0; i < this.props.evaluationRuns; i++) {
            const tmp = await this.internalEvaluateTest(data, testRunData, requestBody, i)
            result.push(tmp);
        }

        return result;
    }


    private async internalEvaluateTest(data: T_DATA, testRunData: T_RUN_DATA, requestBody: ILLMRunnerProps, iterationIdx: number): Promise<EV_DATA_RUN | IRunError> {
        try {
            const resp = await this.sendRequest2Llm(this.props.evaluationLlm.runner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;

            const evaluationResult = await this.internalEvaluateLlmAnswer(data, testRunData, llmAnswer);

            if (this.props.runDir) {
                const body = JSON.stringify({ data, testRun: testRunData, llmAnswer, evaluationResult, promptTokens, completionTokens, totalTime }, null, 2);
                FileUtils.writeFile(this.props.runDir, `evaluation_${iterationIdx + 1}.json`, body);
            }

            return this.mapEvaluationSuccessResponse(data, testRunData, {
                status: "OK",
                evaluationResult,
                totalTime,
                promptTokens,
                completionTokens,
                llmAnswer
            })
        } catch (err) {
            console.error(err)
            return this.mapEvaluationError(data, testRunData, JSON.stringify((err as any)?.message ?? err));
        }
    }



    private async sendRequest2Llm(runner: ILLMRunner, requestBody: ILLMRunnerProps) {
        const resp = await runner.run(requestBody)
        const llmAnswer = resp.output[0] ?? ""
        const { promptTokens, completionTokens, totalTime } = resp;
        return {
            promptTokens,
            completionTokens,
            totalTime,
            llmAnswer
        }
    }


    protected mapTestError(data: T_DATA, error: string): IRunError {
        return {
            status: "ERROR",
            error
        }
    }

    protected mapEvaluationError(data: T_DATA, runData: ITestRunData, error: string): IRunError {
        return {
            status: "ERROR",
            error
        }
    }
}