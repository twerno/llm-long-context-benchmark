import { IEvaluationRunData, ITestData, ITestRunData } from "../../benchmark_orchestrator/AbstractBenchmarkRunner";
import { IQuizEntry } from "./utils/IQuizTypes";

export interface IDatasetQuizTaskTestData extends ITestData {
    quizTest: IQuizEntry
}

export interface IDatasetQuizTaskTestRunData extends ITestRunData { }

export interface IDatasetQuizTaskEvaluationRunData extends IEvaluationRunData { }

