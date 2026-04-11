import z from "zod";
import { IBenchmarkTask } from "../../benchmark_orchestrator/IBenchmarkTask";
import { ILLMRunner } from "../../llmRunner/ILLMRunner";
import DatasetQuizTest, { IEvaluationResult, ILLMResponseToEvaluete } from "./DatasetQuizTest";
import { IQuizData } from "./QuizDataUtils";
import { ZQuizTestParams } from "../../benchmark_orchestrator/configTypes";
import FileUtils from "../../utils/FileUtils";
import path from "node:path";


export interface IDatasetQuizTestRunnerRunProps {
    runId: string,
    homeDir: string,
    iterationDir: string,
    params: z.infer<typeof ZQuizTestParams>
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

    public async saveEvaluationResults() {
        if (!this.evaluationResult) throw new Error("evaluationResult is NULL")

        const csv: string[] = [
            "idx;type;combinedEvaluation;evaluationResults;error"
        ]

        for (let i = 0; i < this.evaluationResult.evaluatedQuestions.length; i++) {
            const row: string[] = []
            const q = this.evaluationResult.evaluatedQuestions[i];
            row.push(i.toString())
            row.push(q.quizEntry.type);
            row.push(q.combinedEvaluation ? "1" : "0")
            row.push(`[${q.evaluationResults.map(v => v ? 1 : 0).join(",")}]`)

            const error = (q.error && JSON.stringify(q.error.message ?? q.error).replace(/[;]/g, "_").slice(1, -1)) || ""
            row.push(error)

            csv.push(`"` + row.join(`";"`) + `"`)
        }
        const body = csv.join("\n")
        FileUtils.writeFile(this.props.iterationDir, `results.csv`, body)

        console.log(`[${this.evaluationResult.correct}/${this.evaluationResult.total}]`);
    }

}