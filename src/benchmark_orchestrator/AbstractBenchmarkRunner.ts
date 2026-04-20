import { ILLMRunner, ILLMRunnerProps } from "../llmRunner/ILLMRunner"
import FileUtils from "../utils/FileUtils"

export interface IBenchmarkRunnerConfig {
    benchmarkType: string,
    logDir: string,
    evaluationRuns: number
}

export interface ITestData {
    testIdx: number,
    systemPrompt?: string,
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

export type IBuildBenchmarkTestsDataFnParams = {
    logDir: string,
}

export type IBuildBenchmarkTestsDataFn<T_PARAMS extends IBuildBenchmarkTestsDataFnParams, T_DATA extends ITestData> = (params: T_PARAMS) => Promise<T_DATA[]>

export interface IAbstractBenchmarkRunner<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> {

    runTest(llmRunner: ILLMRunner, data: T_DATA): Promise<T_RUN_DATA | IRunError>

    evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRun: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>>

    extractDataToCsv(data: T_DATA, testRun: T_RUN_DATA | IRunError, evaluations: Array<EV_DATA_RUN | IRunError>): Promise<object>
}


export abstract class AbstractBenchmarkRunner<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> implements IAbstractBenchmarkRunner<T_DATA, T_RUN_DATA, EV_DATA_RUN> {
    public constructor(protected readonly props: IBenchmarkRunnerConfig) { }

    public abstract evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRun: T_RUN_DATA): Promise<(IRunError | EV_DATA_RUN)[]>
    public abstract extractDataToCsv(data: T_DATA, testRun: IRunError | T_RUN_DATA, evaluations: (IRunError | EV_DATA_RUN)[]): Promise<object>

    protected abstract mapTestSuccessResponse(data: T_DATA, runData: ITestRunData): T_RUN_DATA;

    public async runTest(llmRunner: ILLMRunner, data: T_DATA): Promise<T_RUN_DATA | IRunError> {

        try {
            const requestBody: ILLMRunnerProps = { messages: [] }
            if (data.systemPrompt) {
                requestBody.messages.push({ role: "system", content: data.systemPrompt });
            }
            data.userPrompt.forEach(content => requestBody.messages.push({ role: "user", content }));

            const resp = await this.sendRequest2Llm(llmRunner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;

            if (this.props.logDir) {
                const body = JSON.stringify({ data, llmAnswer, promptTokens, completionTokens, totalTime }, null, 2);
                FileUtils.writeFile(this.props.logDir, `test_${data.testIdx + 1}.json`, body);
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

    protected async sendRequest2Llm(runner: ILLMRunner, requestBody: ILLMRunnerProps) {
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
}

