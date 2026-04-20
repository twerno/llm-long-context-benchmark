import { ILLMRunner, ILLMRunnerProps } from "../llmRunner/ILLMRunner";
import FileUtils from "../utils/FileUtils";
import { ITestData, ITestRunData, IEvaluationRunData, AbstractBenchmarkRunner, IRunError } from "./AbstractBenchmarkRunner";

export abstract class AbstractBenchmarkRunnerAndEvaluator<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> extends AbstractBenchmarkRunner<T_DATA, T_RUN_DATA, EV_DATA_RUN> {

    protected abstract mapTestSuccessResponse(data: T_DATA, runData: ITestRunData): T_RUN_DATA;
    protected abstract buildEvaluationPrompt(data: T_DATA, testRunData: T_RUN_DATA): Promise<string[]>
    protected abstract internalEvaluateLlmAnswer(data: T_DATA, testRunData: T_RUN_DATA, lllAnswer: string): Promise<boolean>
    protected abstract mapEvaluationSuccessResponse(data: T_DATA, runData: ITestRunData, evaluationRunData: IEvaluationRunData): EV_DATA_RUN;

    public async evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRunData: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>> {

        const result: Array<EV_DATA_RUN | IRunError> = [];
        const requestBody: ILLMRunnerProps = { messages: [] }
        const prompts = await this.buildEvaluationPrompt(data, testRunData);
        prompts.forEach(content => requestBody.messages.push({ role: "user", content }));

        for (let i = 0; i < this.props.evaluationRuns; i++) {
            const tmp = await this.internalEvaluateTest(llmRunner, data, testRunData, requestBody, i)
            result.push(tmp);
        }

        return result;
    }


    private async internalEvaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRunData: T_RUN_DATA, requestBody: ILLMRunnerProps, iterationIdx: number): Promise<EV_DATA_RUN | IRunError> {
        try {
            const resp = await this.sendRequest2Llm(llmRunner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;

            const evaluationResult = await this.internalEvaluateLlmAnswer(data, testRunData, llmAnswer);

            if (this.props.logDir) {
                const body = JSON.stringify({ data, testRun: testRunData, llmAnswer, evaluationResult, promptTokens, completionTokens, totalTime }, null, 2);
                FileUtils.writeFile(this.props.logDir, `evaluation_${data.testIdx + 1}_${iterationIdx + 1}.json`, body);
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

    protected mapEvaluationError(data: T_DATA, runData: ITestRunData, error: string): IRunError {
        return {
            status: "ERROR",
            error
        }
    }
}