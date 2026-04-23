import z from "zod"
import { ILLMRunner, ILLMRunnerProps } from "../llmRunner/ILLMRunner"
import FileUtils from "../utils/FileUtils"

export const ZTestRunDataSchema = z.object({
    status: z.literal("OK"),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTime: z.number(),
    llmAnswer: z.string()
})

export const ZRunErrorSchema = z.object({
    status: z.literal("ERROR"),
    errorMsg: z.string(),
    totalTime: z.number()
})

export const ZEvaluationRunDataSchema = z.object({
    status: z.literal("OK"),
    evaluationResult: z.boolean(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTime: z.number(),
    llmAnswer: z.string()
})


export interface IBenchmarkRunnerConfig {
    benchmarkType: string,
    logDir: string,
    evaluationRuns: number,
    resumeUnfinishedRun?: boolean
}

export interface ITestData {
    testIdx: number,
    systemPrompt?: string,
    userPrompt: string[]
}

export type ITestRunData = z.infer<typeof ZTestRunDataSchema>

export type IEvaluationRunData = z.infer<typeof ZEvaluationRunDataSchema>

export type IRunError = z.infer<typeof ZRunErrorSchema>

export type IBuildBenchmarkTestsDataFnParams = {
    logDir: string,
}

export type IBuildBenchmarkTestsDataFn<T_PARAMS extends IBuildBenchmarkTestsDataFnParams, T_DATA extends ITestData> = (params: T_PARAMS) => Promise<T_DATA[]>

export interface IAbstractBenchmarkRunner<T_DATA extends ITestData, T_RUN_DATA extends ITestRunData, EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData> {

    runTest(llmRunner: ILLMRunner, data: T_DATA): Promise<T_RUN_DATA | IRunError>

    evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRun: T_RUN_DATA): Promise<Array<EV_DATA_RUN | IRunError>>

    extractDataToCsv(data: T_DATA, testRun: T_RUN_DATA | IRunError, evaluations: Array<EV_DATA_RUN | IRunError>): Promise<object>
}


export abstract class AbstractBenchmarkRunner<
    T_DATA extends ITestData,
    T_RUN_DATA extends ITestRunData,
    EV_DATA_RUN extends IEvaluationRunData = IEvaluationRunData
> implements IAbstractBenchmarkRunner<T_DATA, T_RUN_DATA, EV_DATA_RUN> {
    public constructor(protected readonly props: IBenchmarkRunnerConfig) { }

    public abstract evaluateTest(llmRunner: ILLMRunner, data: T_DATA, testRun: T_RUN_DATA): Promise<(IRunError | EV_DATA_RUN)[]>
    public abstract extractDataToCsv(data: T_DATA, testRun: IRunError | T_RUN_DATA, evaluations: (IRunError | EV_DATA_RUN)[]): Promise<object>

    protected abstract mapTestSuccessResponse(data: T_DATA, runData: ITestRunData): T_RUN_DATA;

    public async runTest(llmRunner: ILLMRunner, data: T_DATA): Promise<T_RUN_DATA | IRunError> {
        const start = performance.now();
        const filename = `test_${data.testIdx + 1}.json`

        const previousResult = this.props.resumeUnfinishedRun
            ? await this.readRunTestDataFromLog(filename)
            : undefined
        if (previousResult) {
            return previousResult;
        }

        try {
            const requestBody: ILLMRunnerProps = { messages: [] }
            if (data.systemPrompt) {
                requestBody.messages.push({ role: "system", content: data.systemPrompt });
            }
            data.userPrompt.forEach(content => requestBody.messages.push({ role: "user", content }));

            const resp = await this.sendRequest2Llm(llmRunner, requestBody);
            const { completionTokens, llmAnswer, promptTokens, totalTime } = resp;
            const testRunData = this.mapTestSuccessResponse(data, {
                status: "OK",
                llmAnswer,
                totalTime,
                promptTokens,
                completionTokens,
            })

            if (this.props.logDir) {
                const body: ILogFileBodyStructure<T_DATA, T_RUN_DATA> = { data, testRunData }
                FileUtils.writeFile(this.props.logDir, filename, JSON.stringify(body, null, 2));
            }

            return testRunData
        } catch (err) {
            console.error(err)
            const errorMsg = (err as any)?.message ?? err

            const testRunData = this.mapTestError(data, JSON.stringify(errorMsg), Math.round(performance.now() - start));
            if (this.props.logDir) {
                const body: ILogFileBodyStructure<T_DATA, T_RUN_DATA> = { data, testRunData }
                FileUtils.writeFile(this.props.logDir, filename, JSON.stringify(body, null, 2));
            }
            return testRunData
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

    protected mapTestError(data: T_DATA, errorMsg: string, totalTime: number): IRunError {
        return {
            status: "ERROR",
            errorMsg,
            totalTime
        }
    }

    protected async readRunTestDataFromLog(filename: string): Promise<T_RUN_DATA | IRunError | undefined> {
        if (!FileUtils.fileExist(this.props.logDir, filename)) {
            return undefined;
        }

        try {
            const text = FileUtils.readFile(this.props.logDir, filename);
            const json = JSON.parse(text)
            if (!ZLogFileBodyStructureSchema.safeParse(json).success) {
                return undefined;
            }
            if (this.validateRunData(json.testRunData)) {
                console.log("testRunData read from file")
                return json.testRunData;
            }
        } catch (err) {
            console.error(err);
        }
        return undefined;
    }

    protected abstract validateRunData(x: any): x is T_RUN_DATA | IRunError;
}

type ILogFileBodyStructure<T_DATA, T_RUN_DATA> = {
    data: T_DATA,
    testRunData: T_RUN_DATA | IRunError
}

const ZLogFileBodyStructureSchema = z.object({
    data: z.object(),
    testRunData: z.object({ status: z.enum(["OK", "ERROR"]) })
})

