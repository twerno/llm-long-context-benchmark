import path from "node:path";
import z from "zod";
import { ZQuizTestParamsSchema } from "../benchmark_orchestrator/configTypes";
import { IBenchmarkTask } from "../benchmark_orchestrator/IBenchmarkTask";
import DatasetQuizTest, { IEvaluationResult, ILLMResponseToEvaluete } from "../benchmarks/datasetTest/DatasetQuizTest";
import { IQuizData } from "../benchmarks/datasetTest/QuizDataUtils";
import { ILLMRunner } from "../llmRunner/ILLMRunner";


export interface IDatasetQuizTestRunnerRunProps {
    runId: string,
    homeDir: string,
    iterationDir: string,
    params: z.infer<typeof ZQuizTestParamsSchema>
}


export default class DatasetQuizBenchmarkTask implements IBenchmarkTask {

    private responsesToEvaluate?: ILLMResponseToEvaluete[]
    private quizData?: IQuizData
    private evaluationResult?: IEvaluationResult

    public constructor(private props: IDatasetQuizTestRunnerRunProps) {

    }

    public async run(llmRunner: ILLMRunner) {
        this.quizData = await DatasetQuizTest
            .getQuizData({ datasetSize: this.props.params.datasetSetSize, setsOfQuestions: this.props.params.questionsSetSize }, this.props.homeDir)

        const runId = this.props.runId
        this.responsesToEvaluate = await DatasetQuizTest.execute({ runId, quizData: this.quizData, llmRunner, dirPath: path.join(this.props.iterationDir, "data") })
    }

    public async evaluate(llmRunner: ILLMRunner) {
        const runId = this.props.runId

        if (!this.quizData) throw new Error(`quizData is NULL`)
        if (!this.responsesToEvaluate) throw new Error("responsesToEvaluate is NULL")

        this.evaluationResult = await DatasetQuizTest.evaluate({
            metadata: { runId, quizId: this.quizData?.quizId, dirPath: path.join(this.props.iterationDir, "data") },
            evaluationStepRuns: this.props.params.evaluationStepRuns,
            llmRunner,
            responsesToEvaluate: this.responsesToEvaluate,
        })
    }

    public async getEvaluationResults() {
        if (!this.evaluationResult)
            return []

        const results: IResultCSVSchema[] = []

        for (let i = 0; i < this.evaluationResult.evaluatedQuestions.length; i++) {
            const q = this.evaluationResult.evaluatedQuestions[i];
            results.push({
                question_idx: i,
                question_set_no: q.quizEntry.questionSetNo,
                question_no_in_set: q.quizEntry.questionNo,
                question_type: q.quizEntry.type,
                evaluation_success: q.combinedEvaluation ? 1 : 0,
                successfull_evaluations: q.evaluationResults.reduce((prev, curr) => prev + (curr ? 1 : 0), 0),
                evaluation_steps_no: q.evaluationResults.length,
                error: (q.error && JSON.stringify(q.error.message ?? q.error).replace(/[;]/g, "_").slice(1, -1)) || "",
            })
        }
        return results;
    }

}

interface IResultCSVSchema {
    question_idx: number,
    question_set_no: number,
    question_no_in_set: number,
    question_type: string,
    evaluation_success: 1 | 0,
    evaluation_steps_no: number,
    successfull_evaluations: number,
    error: string


}



