import { IBenchmarkConfigMap } from "../app/configType";
import { buildDatasetBenchmarkData } from "../benchmarks/dataset_quiz_benchmark/buildDatasetBenchmarkData";
import { DatasetQuizBenchmarkRunner } from "../benchmarks/dataset_quiz_benchmark/DatasetQuizBenchmarkRunner";
import { buildHiddenPhraseData } from "../benchmarks/hidden_phrase/buildHiddenPhraseData";
import { HiddenPhraseBenchmarkRunner } from "../benchmarks/hidden_phrase/HiddenPhraseBenchmarkRunner";
import { IAbstractBenchmarkRunner, IBenchmarkRunnerConfig, IEvaluationRunData, ITestData, ITestRunData } from "./AbstractBenchmarkRunner";




export async function buildBenchmarkData(logDir: string, benchmarkProps: IBenchmarkConfigMap[string]): Promise<ITestData[]> {
    switch (benchmarkProps.benchmark_type) {
        case "dataset_quiz":
            return await buildDatasetBenchmarkData({ logDir, datasetSize: benchmarkProps.params.dataset_set_size, questionsSetSize: benchmarkProps.params.questions_set_size })
        case "hidden_phrase":
            return await buildHiddenPhraseData({ logDir, noOfHiddenPhrases: benchmarkProps.params.no_of_hidden_phrases, textLength: benchmarkProps.params.text_length })

    }
}

export async function buildBenchmarkRunner(benchmarkProps: IBenchmarkConfigMap[string], props: IBenchmarkRunnerConfig): Promise<IAbstractBenchmarkRunner<ITestData, ITestRunData, IEvaluationRunData>> {
    switch (benchmarkProps.benchmark_type) {
        case "dataset_quiz":
            return new DatasetQuizBenchmarkRunner(props)
        case "hidden_phrase":
            return new HiddenPhraseBenchmarkRunner(props)

    }
}