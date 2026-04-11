import z from "zod";
import { IBenchmarkTask } from "../../benchmark_orchestrator/IBenchmarkTask";
import { ILLMRunner } from "../../llmRunner/ILLMRunner";
import DatasetQuizTest, { IEvaluationResult, ILLMResponseToEvaluete } from "./DatasetQuizTest";
import { IQuizData } from "./QuizDataUtils";
import { ZQuizTestParams } from "../../benchmark_orchestrator/configTypes";



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
        this.responsesToEvaluate = await DatasetQuizTest.execute({ runId, quizData: this.quizData, llmRunner, dirPath: this.props.iterationDir })
    }

    public async evaluate(llmRunner: ILLMRunner) {
        const runId = this.props.runId

        if (!this.quizData) throw new Error(`quizData is NULL`)
        if (!this.responsesToEvaluate) throw new Error("responsesToEvaluate is NULL")

        this.evaluationResult = await DatasetQuizTest.evaluate({
            metadata: { runId, quizId: this.quizData?.quizId, dirPath: this.props.iterationDir },
            evaluationStepRuns: this.props.params.evaluationStepRuns,
            llmRunner,
            responsesToEvaluate: this.responsesToEvaluate,
        })
    }

    public async saveEvaluationResults() {
        if (!this.evaluationResult) throw new Error("evaluationResult is NULL")

        console.log(`[${this.evaluationResult.correct}/${this.evaluationResult.total}]`);
    }



}