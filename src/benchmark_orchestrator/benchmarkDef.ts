import { IBenchmarkConfigMap } from "../app/configType";
import { buildDatasetBenchmarkData } from "../benchmarks/dataset_quiz_benchmark/buildDatasetBenchmarkData";
import { DatasetQuizBenchmarkRunner } from "../benchmarks/dataset_quiz_benchmark/DatasetQuizBenchmarkRunner";
import { IAbstractBenchmarkRunner, IBenchmarkRunnerConfig, IEvaluationRunData, ITestData, ITestRunData } from "./AbstractBenchmarkRunner";




export async function buildBenchmarkData(logDir: string, benchmarkProps: IBenchmarkConfigMap[string]): Promise<ITestData[]> {
    switch (benchmarkProps.benchmark_type) {
        case "dataset_quiz":
            return await buildDatasetBenchmarkData({ logDir, datasetSize: benchmarkProps.params.datasetSetSize, questionsSetSize: benchmarkProps.params.questionsSetSize })
        case "dataset_quiz2":
            return Promise.resolve([{
                testIdx: 0,
                systemPrompt: [],
                userPrompt: []
            }])
    }
}

export async function buildBenchmarkRunner(benchmarkProps: IBenchmarkConfigMap[string], props: IBenchmarkRunnerConfig): Promise<IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>> {
    switch (benchmarkProps.benchmark_type) {
        case "dataset_quiz":
            return new DatasetQuizBenchmarkRunner(props)
        case "dataset_quiz2":
            return null as any

    }
}