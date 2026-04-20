import FileUtils from "../../utils/FileUtils";
import buildFantasyCountryQuiz from "./utils/buildQuizFromDataset";
import convertDataset2Prompt from "./utils/convertDataset2Prompt";
import FantasyCountryDatasetGenerator from "./dataset_generator/FantasyCountryDatasetGenerator";
import { IBuildBenchmarkTestsDataFn, IBuildBenchmarkTestsDataFnParams } from "../../benchmark_orchestrator/AbstractBenchmarkRunner";
import { IDatasetQuizTaskTestData } from "./datasetQuizBenchmarkTypes";

export interface IDatasetQuizBenchmarkTestDataBuilderParams extends IBuildBenchmarkTestsDataFnParams {
    datasetSize: number,
    questionsSetSize: number
}

export const buildDatasetBenchmarkData: IBuildBenchmarkTestsDataFn<IDatasetQuizBenchmarkTestDataBuilderParams, IDatasetQuizTaskTestData> = async (params: IDatasetQuizBenchmarkTestDataBuilderParams): Promise<IDatasetQuizTaskTestData[]> => {

    console.log(`DatasetQuiz ${JSON.stringify(params)} generation start.`)

    const dataset = await buildDataset(params);

    const knowledgePrompt = dataset.map(convertDataset2Prompt);

    const quizEntries = Array.from({ length: params.questionsSetSize })
        .map((_, idx) => buildFantasyCountryQuiz(dataset, idx))
        .reduce((prev, curr) => ([...prev, ...curr]), [])

    return quizEntries
        .map((quizTest, idx) => ({
            testIdx: idx,
            systemPrompt: undefined,
            quizTest,
            userPrompt: [...knowledgePrompt, quizTest.question]
        }))

}


async function buildDataset(params: IDatasetQuizBenchmarkTestDataBuilderParams) {
    const fantasyCountryGenerator = new FantasyCountryDatasetGenerator();

    const dataset = await Promise.all(
        Array.from({ length: params.datasetSize })
            .map(() => fantasyCountryGenerator.generateCountry())
    )

    FileUtils.writeFile(params.logDir, "dataset.json", JSON.stringify(dataset, null, 2))

    return dataset;
}