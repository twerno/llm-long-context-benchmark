import { IBenchmarkTask } from "../../benchmark_orchestrator/IBenchmarkTask";
import { ILLMRunner } from "../../llmRunner/ILLMRunner";
import DatasetQuizTest, { IEvaluationResult, ILLMResponseToEvaluete } from "./DatasetQuizTest";
import { IQuizData } from "./QuizDataUtils";

export interface IDatasetQuizTestRunnerRunProps {
    runId: string,
    homeDir: string,
    iterationDir: string,
    quizParams: Parameters<typeof DatasetQuizTest.getQuizData>[0],
    evaluationParams: { noOfEvaluationRepeats: number },
}


export default class DatasetQuizBenchmarkTask implements IBenchmarkTask {

    private responsesToEvaluate?: ILLMResponseToEvaluete[]
    private quizData?: IQuizData
    private evaluationResult?: IEvaluationResult

    public constructor(private props: IDatasetQuizTestRunnerRunProps) {

    }

    public async run(llmRunner: ILLMRunner) {
        this.quizData = await DatasetQuizTest
            .getQuizData(this.props.quizParams, this.props.homeDir)

        const runId = this.props.runId
        this.responsesToEvaluate = await DatasetQuizTest.execute({ runId, quizData: this.quizData, llmRunner, dirPath: this.props.iterationDir })
    }

    public async evaluate(llmRunner: ILLMRunner) {
        const runId = this.props.runId

        if (!this.quizData) throw new Error(`quizData is NULL`)
        if (!this.responsesToEvaluate) throw new Error("responsesToEvaluate is NULL")

        this.evaluationResult = await DatasetQuizTest.evaluate({
            metadata: { runId, quizId: this.quizData?.quizId, dirPath: this.props.iterationDir },
            repeatEvaluationNTimes: this.props.evaluationParams.noOfEvaluationRepeats,
            llmRunner,
            responsesToEvaluate: this.responsesToEvaluate,
        })
    }

    public async saveEvaluationResults() {
        if (!this.evaluationResult) throw new Error("evaluationResult is NULL")

        console.log(`[${this.evaluationResult.correct}/${this.evaluationResult.total}]`);
    }



}