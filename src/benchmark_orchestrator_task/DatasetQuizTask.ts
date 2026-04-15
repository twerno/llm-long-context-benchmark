import { IQuizEntry } from "../benchmarks/datasetTest/DatasetTypes";
import { IQuizData } from "../benchmarks/datasetTest/QuizDataUtils";
import { AbstractBenchmarkRunner, IEvaluationRunData, IRunError, ITestData, ITestRunData } from "./AbstractBenchmarkRunner";

interface IDatasetQuizTaskTestData extends ITestData {
    quizData: IQuizData,
    quizTest: IQuizEntry
}

interface IDatasetQuizTaskTestRunData extends ITestRunData { }

interface IDatasetQuizTaskEvaluationRunData extends IEvaluationRunData { }


class DatasetQuizTask extends AbstractBenchmarkRunner<IDatasetQuizTaskTestData, IDatasetQuizTaskTestRunData, IDatasetQuizTaskEvaluationRunData> {


    protected mapTestSuccessResponse(data: IDatasetQuizTaskTestData, runData: ITestRunData): IDatasetQuizTaskTestRunData {
        return runData;
    }


    protected async buildEvaluationPrompt(data: IDatasetQuizTaskTestData, testRunData: IDatasetQuizTaskTestRunData): Promise<string[]> {
        const userPrompt = messageTemplate
            .replace("<QUESTION>", data.quizTest.question)
            .replace("<HINT>", data.quizTest.hint)
            .replace("<ANSWER>", testRunData.llmAnswer);

        return [
            systemPrompt,
            userPrompt
        ]
    }


    protected async internalEvaluateLlmAnswer(data: IDatasetQuizTaskTestData, testRunData: IDatasetQuizTaskTestRunData, lllAnswer: string): Promise<boolean> {
        return lllAnswer.includes("TRUE") && !lllAnswer.includes("FALSE");
    }


    protected mapEvaluationSuccessResponse(data: IDatasetQuizTaskTestData, runData: ITestRunData, evaluationRunData: IEvaluationRunData): IDatasetQuizTaskEvaluationRunData {
        return evaluationRunData
    }

    public async extractDataToCsv(data: IDatasetQuizTaskTestData, testRun: IDatasetQuizTaskTestRunData | IRunError, evaluations: (IDatasetQuizTaskEvaluationRunData | IRunError)[]): Promise<object> {

        const testRunCols = testRun.status === "OK"
            ? {
                testStatus: 1,
                testError: "",
                testPromptTokens: testRun.promptTokens,
                testCompletionTokens: testRun.completionTokens,
                testTotalTime: testRun.totalTime
            }
            : {
                testStatus: 0,
                testError: testRun.error,
                testPromptTokens: 0,
                testCompletionTokens: 0,
                testTotalTime: 0
            }

        const evaluationTotalRuns = evaluations.length
        const evaluationSuccessRuns = evaluations.filter(v => v.status === "OK" && v.evaluationResult).length
        const evaluationErrors = evaluations.filter(v => v.status === "ERROR").length
        const evaluationStatus = evaluationTotalRuns === 0
            ? 0
            : evaluationTotalRuns === evaluationSuccessRuns
                ? 1
                : 0
        const evaluationTotalTime = evaluations.filter(v => v.status === "OK").reduce((prev, curr) => prev + curr.totalTime, 0)

        return {
            quizId: data.quizData.quizId,
            ...testRunCols,
            evaluationStatus,
            evaluationSuccessRuns,
            evaluationTotalRuns,
            evaluationErrors,
            evaluationTotalTime
        }
    }

}



const systemPrompt = `### ROLE
You are a strict grading assistant. Your task is to evaluate if the User's Answer is correct based on the provided Reference Information in response to the Question.

### EVALUATION RULES
1. **Semantic Accuracy:** The User's Answer must be semantically equivalent to the Reference Information. 
2. **Flexibility:** Accept synonyms, different phrasing, and paraphrasing, provided the core fact is correct.
3. **Irrelevant Info:** If the user provides additional information that is outside the scope of the question, ignore it and focus only on whether the core answer is correct.
4. **Typos:** Do not accept answers with spelling errors.
5. **Strictness:** If the user's answer contradicts the Reference Information or is factually incorrect, it must be FALSE.

### OUTPUT FORMAT
Respond ONLY with one of these two words:
- "TRUE" if the answer is correct.
- "FALSE" if the answer is incorrect.

Do not provide any explanations, notes, or extra text.`;

const messageTemplate = `### DATA
- **Question:** "<QUESTION>"
- **Reference Information (Correct Answer/Hint):** "<HINT>"
- **User's Answer:** "<ANSWER>"`;