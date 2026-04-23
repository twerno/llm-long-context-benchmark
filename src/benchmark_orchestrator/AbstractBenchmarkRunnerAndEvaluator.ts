import z from "zod";
import { ILLMRunner, ILLMRunnerProps } from "../llmRunner/ILLMRunner";
import FileUtils from "../utils/FileUtils";
import { ITestData, ITestRunData, IEvaluationRunData, AbstractBenchmarkRunner, IRunError } from "./AbstractBenchmarkRunner";

export interface IPrompt {
    systemPrompt?: string,
    userPrompt: string[]
}

export abstract class AbstractBenchmarkRunnerAndEvaluator<
    T_DATA extends ITestData,
    T_RUN_DATA extends ITestRunData,
    EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData
> extends AbstractBenchmarkRunner<T_DATA, T_RUN_DATA, EV_DATA_RUN> {

    protected abstract mapTestSuccessResponse(data: T_DATA, runData: ITestRunData): T_RUN_DATA;
    protected abstract buildEvaluationPrompt(data: T_DATA, testRunData: T_RUN_DATA): Promise<IPrompt>
    protected abstract internalEvaluateLlmAnswer(data: T_DATA, testRunData: T_RUN_DATA, lllAnswer: string): Promise<boolean>
    protected abstract mapEvaluationSuccessResponse(data: T_DATA, runData: ITestRunData, evaluationRunData: IEvaluationRunData): EV_DATA_RUN;

    public async evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRunData: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>> {

        const result: Array<EV_DATA_RUN | IRunError> = [];
        const requestBody: ILLMRunnerProps = { messages: [] }
        const prompts = await this.buildEvaluationPrompt(data, testRunData);
        prompts.systemPrompt && requestBody.messages.push({ role: "system", content: prompts.systemPrompt })
        prompts.userPrompt.forEach(content => requestBody.messages.push({ role: "user", content }));

        for (let i = 0; i < this.props.evaluationRuns; i++) {
            const tmp = await this.internalEvaluateTest(llmRunner, data, testRunData, requestBody, i)
            result.push(tmp);
        }

        return result;
    }


    private async internalEvaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRunData: T_RUN_DATA, requestBody: ILLMRunnerProps, iterationIdx: number): Promise<EV_DATA_RUN | IRunError> {
        const start = performance.now();
        const filename = `evaluation_${data.testIdx + 1}_${iterationIdx + 1}.json`

        const previousResult = this.props.resumeUnfinishedRun
            ? await this.readRunEvalDataFromLog(filename)
            : undefined
        if (previousResult) {
            return previousResult;
        }

        try {
            const resp = await this.sendRequest2Llm(llmRunner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;

            const evaluationResult = await this.internalEvaluateLlmAnswer(data, testRunData, llmAnswer);
            const evaluationRun = this.mapEvaluationSuccessResponse(data, testRunData, {
                status: "OK",
                evaluationResult,
                totalTime,
                promptTokens,
                completionTokens,
                llmAnswer
            })

            if (this.props.logDir) {
                const body: ILogFileBodyStructure<T_DATA, T_RUN_DATA, EV_DATA_RUN> = { data, testRunData, evaluationRun };
                FileUtils.writeFile(this.props.logDir, filename, JSON.stringify(body, null, 2));
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
            const errorMsg = (err as any)?.message ?? err
            const evaluationRun = this.mapEvaluationError(data, testRunData, JSON.stringify(errorMsg), Math.round(performance.now() - start));
            if (this.props.logDir) {
                const body: ILogFileBodyStructure<T_DATA, T_RUN_DATA, EV_DATA_RUN> = { data, testRunData, evaluationRun }
                FileUtils.writeFile(this.props.logDir, filename, JSON.stringify(body, null, 2));
            }
            return evaluationRun;
        }
    }

    protected mapEvaluationError(data: T_DATA, runData: ITestRunData, error: string, totalTime: number): IRunError {
        return {
            status: "ERROR",
            errorMsg: error,
            totalTime
        }
    }

    protected async readRunEvalDataFromLog(filename: string): Promise<EV_DATA_RUN | IRunError | undefined> {
        if (!FileUtils.fileExist(this.props.logDir, filename)) {
            return undefined;
        }

        try {
            const text = FileUtils.readFile(this.props.logDir, filename);
            const json = JSON.parse(text)
            if (!ZEvalLogFileBodyStructureSchema.safeParse(json).success) {
                return undefined;
            }
            if (this.validateEvalRunData(json.evaluationRun)) {
                console.log("testEvalData read from file")
                return json.evaluationRun;
            }
        } catch (err) {
            console.error(err);
        }
        return undefined;
    }

    protected abstract validateEvalRunData(x: any): x is EV_DATA_RUN | IRunError;
}

type ILogFileBodyStructure<T_DATA, T_RUN_DATA, EV_DATA_RUN> = {
    data: T_DATA,
    testRunData: T_RUN_DATA | IRunError,
    evaluationRun: EV_DATA_RUN | IRunError
}

const ZEvalLogFileBodyStructureSchema = z.object({
    data: z.object(),
    testRunData: z.object({ status: z.enum(["OK", "ERROR"]) }),
    evaluationRun: z.object({ status: z.enum(["OK", "ERROR"]) }),
})