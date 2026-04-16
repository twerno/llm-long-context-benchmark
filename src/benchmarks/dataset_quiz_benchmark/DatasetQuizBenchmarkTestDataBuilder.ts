import { IBenchmarkDataBuilder } from "../../benchmark_orchestrator/AbstractBenchmarkRunner";
import FileUtils from "../../utils/FileUtils";
import buildFantasyCountryQuiz from "./utils/buildQuizFromDataset";
import convertDataset2Prompt from "./utils/convertDataset2Prompt";
import FantasyCountryDatasetGenerator from "./dataset_generator/FantasyCountryDatasetGenerator";
import { IDatasetQuizTaskTestData } from "./DatasetQuizBenchmarkTypes";

export interface IDatasetQuizBenchmarkTestDataBuilderParams {
    logDir: string,
    quizId: string,
    datasetSize: number,
    questionsSetSize: number
}

export class DatasetQuizBenchmarkTestDataBuilder implements IBenchmarkDataBuilder<IDatasetQuizBenchmarkTestDataBuilderParams, IDatasetQuizTaskTestData> {

    public async buildBenchmarkTestsData(params: IDatasetQuizBenchmarkTestDataBuilderParams): Promise<IDatasetQuizTaskTestData[]> {

        console.log(`DatasetQuiz ${JSON.stringify(params)} generation start.`)

        const dataset = await this.buildDataset(params);

        const systemPrompt = dataset.map(convertDataset2Prompt);

        const quizEntries = Array.from({ length: params.questionsSetSize })
            .map((_, idx) => buildFantasyCountryQuiz(dataset, idx))
            .reduce((prev, curr) => ([...prev, ...curr]), [])

        return quizEntries
            .map((quizTest, idx) => ({
                testIdx: idx,
                systemPrompt,
                quizTest,
                userPrompt: [quizTest.question]
            }))

    }

    private async buildDataset(params: IDatasetQuizBenchmarkTestDataBuilderParams) {
        const fantasyCountryGenerator = new FantasyCountryDatasetGenerator();

        const dataset = await Promise.all(
            Array.from({ length: params.datasetSize })
                .map(() => fantasyCountryGenerator.generateCountry())
        )

        FileUtils.writeFile(params.logDir, "dataset.json", JSON.stringify(dataset, null, 2))

        return dataset;
    }

}