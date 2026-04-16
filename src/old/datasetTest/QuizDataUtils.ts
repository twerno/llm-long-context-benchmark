// import path from "node:path";
// import { IQuizEntry } from "./DatasetTypes";
// import buildFantasyCountryQuiz from "../dataset_quiz_benchmark/utils/buildQuizFromDataset";
// import convertDataset2Prompt from "../dataset_quiz_benchmark/utils/convertDataset2Prompt";
// import FantasyCountryDatasetGenerator from "../dataset_quiz_benchmark/dataset_generator/FantasyCountryDatasetGenerator";
// import { ICountrySchema } from "../dataset_quiz_benchmark/dataset_generator/FantasyCountryDatasetTypes";
// import FileUtils from "../../utils/FileUtils";
// import { existsSync, readFileSync } from "node:fs";


// interface IBuildQuizProps {
//     amountOfCountriesInDS: number,
//     setsOfQuestions: number
//     quizId: string
// }

// export interface IQuizData {
//     quizId: string,
//     dataset: ICountrySchema[],
//     datasetPrompt: string,
//     quizTests: IQuizEntry[],
// }

// export default {
//     buildQuizData,
//     saveQuiz,
//     loadQuiz,
// }

// async function buildQuizData(props: IBuildQuizProps, benchmarkHomeDir: string): Promise<IQuizData> {
//     console.log(`[Quiz="${props.quizId}"] data generation start.`)

//     const fantasyCountryGenerator = new FantasyCountryDatasetGenerator();

//     const dataset = await Promise.all(
//         Array.from({ length: props.amountOfCountriesInDS })
//             .map(() => fantasyCountryGenerator.generateCountry())
//     )

//     const datasetPrompt = dataset.map(convertDataset2Prompt)
//         .join("\n\n")

//     const quizEntries = Array.from({ length: props.setsOfQuestions })
//         .map((_, idx) => buildFantasyCountryQuiz(dataset, idx))
//         .reduce((prev, curr) => ([...prev, ...curr]), [])

//     const quizData = {
//         quizId: props.quizId,
//         dataset,
//         datasetPrompt,
//         quizEntries
//     }

//     console.log(`[Quiz="${props.quizId}"] data generated.`)
//     saveQuiz(quizData, benchmarkHomeDir)
//     console.log(`[Quiz="${props.quizId}"] data saved.`)

//     return quizData;
// }

// function saveQuiz(data: IQuizData, benchmarkHomeDir: string) {
//     const dirPath = path.join(benchmarkHomeDir, "quiz_data", data.quizId);

//     FileUtils.writeFile(dirPath, `dataset.json`, JSON.stringify(data.dataset, null, 2))
//     FileUtils.writeFile(dirPath, `dataset_prompt.md`, data.datasetPrompt)
//     FileUtils.writeFile(dirPath, `quiz.json`, JSON.stringify(data.quizTests, null, 2))
// }

// function loadQuiz(quizId: string, benchmarkHomeDir: string): IQuizData | null {
//     const dirPath = path.join(benchmarkHomeDir, "quiz_data", quizId);
//     if (!existsSync(dirPath)) {
//         return null;
//     }

//     const datasetTEXT = readFileSync(path.join(dirPath, `dataset.json`), { encoding: "utf-8" })
//     const datasetPromptTEXT = readFileSync(path.join(dirPath, `dataset_prompt.md`), { encoding: "utf-8" })
//     const quizTEXT = readFileSync(path.join(dirPath, `quiz.json`), { encoding: "utf-8" })

//     if (!datasetTEXT || !datasetPromptTEXT || !quizTEXT)
//         return null;

//     return {
//         quizId,
//         dataset: JSON.parse(datasetTEXT),
//         datasetPrompt: datasetPromptTEXT,
//         quizTests: JSON.parse(quizTEXT)
//     }
// }
