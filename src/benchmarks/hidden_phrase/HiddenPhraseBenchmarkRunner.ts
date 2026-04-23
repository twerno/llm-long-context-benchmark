import z from "zod";
import { AbstractBenchmarkRunner, IEvaluationRunData, IRunError, ITestData, ITestRunData, ZEvaluationRunDataSchema, ZRunErrorSchema, ZTestRunDataSchema } from "../../benchmark_orchestrator/AbstractBenchmarkRunner";
import { ILLMRunner } from "../../llmRunner/ILLMRunner";
import { IHiddenPhraseTestData } from "./buildHiddenPhraseData";


export interface IHiddenPhraseEvaluationRunData extends IEvaluationRunData {
    secretsFound: number,
    secretsTotal: number,
    falsePossitive: number
}


export class HiddenPhraseBenchmarkRunner extends AbstractBenchmarkRunner<IHiddenPhraseTestData, ITestRunData, IEvaluationRunData> {

    protected validateRunData(x: any): x is IEvaluationRunData | IRunError {
        throw !!z.union([ZEvaluationRunDataSchema, ZRunErrorSchema]).parse(x);
    }

    protected validateEvalRunData(x: any): x is ITestRunData | IRunError {
        return !!z.union([ZTestRunDataSchema, ZRunErrorSchema]).parse(x)
    }


    protected mapTestSuccessResponse(data: ITestData, runData: ITestRunData): ITestRunData {
        return runData;
    }


    public async evaluateTest(llmRunner: ILLMRunner, data: IHiddenPhraseTestData, testRunData: ITestRunData): Promise<Array<IHiddenPhraseEvaluationRunData | IRunError>> {

        const llmPhrases = extractPhrasesFromLlmAnswer([testRunData.llmAnswer])

        let secretsFound = 0;
        for (const phrase of data.hiddenPhrases) {
            if (llmPhrases.includes(phrase))
                secretsFound++
        }

        const falsePossitive = llmPhrases.length - secretsFound;

        return [
            {
                secretsFound,
                secretsTotal: data.hiddenPhrases.length + falsePossitive,
                falsePossitive,
                status: "OK",
                totalTime: 0,
                completionTokens: 0,
                evaluationResult: falsePossitive === 0 && secretsFound === data.hiddenPhrases.length,
                llmAnswer: "",
                promptTokens: 0
            }
        ]
    }


    public async extractDataToCsv(data: ITestData, testRun: ITestRunData | IRunError, evaluations: (IHiddenPhraseEvaluationRunData | IRunError)[]): Promise<object> {

        // test run
        const testRunCols = testRun.status === "OK"
            ? {
                testStatus: 1,
                testError: "",
            }
            : {
                testStatus: 0,
                testError: testRun.errorMsg,
            }


        // evaluation
        const [evaluation] = evaluations

        const evaluationStatus = evaluation.status === "OK"
        const falsePossitive = evaluation.status === "OK" && evaluation.falsePossitive
        const secretsFound = evaluation.status === "OK" && evaluation.secretsFound
        const secretsTotal = evaluation.status === "OK" && evaluation.secretsTotal

        return {
            ...testRunCols,
            evaluationStatus,
            falsePossitive,
            secretsFound,
            secretsTotal
        }
    }

}


function extractPhrasesFromLlmAnswer(llmAnswer: string[]) {
    const combinedOutput = llmAnswer.join(" ")
    const staringIdx = combinedOutput.lastIndexOf("The hidden phrases are:");
    const resultOutput = combinedOutput.substring(staringIdx + "The hidden phrases are:".length)
    return resultOutput
        .split(",")
        .map(v => v.trim())
}