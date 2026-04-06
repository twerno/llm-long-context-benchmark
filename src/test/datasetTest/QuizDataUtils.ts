import path from "node:path";
import { IQuizEntry } from "./DatasetTypes";
import buildFantasyCountryQuiz from "./fantasyCountryGenerator/buildFantasyCountryQuiz";
import convertFantasyCountryDataset2Prompt from "./fantasyCountryGenerator/convertFantasyCountryDataset2Prompt";
import FantasyCountryDatasetGenerator from "./fantasyCountryGenerator/datasetGenerator/FantasyCountryDatasetGenerator";
import { ICountrySchema } from "./fantasyCountryGenerator/datasetGenerator/FantasyCountryDatasetTypes";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";


interface IBuildQuizProps {
    amountOfCountriesInDS: number,
    setsOfQuestions: number
    quizId: string
}

export interface IQuizData {
    quizId: string,
    dataset: ICountrySchema[],
    datasetPrompt: string,
    quizEntries: IQuizEntry[],
}

export default {
    buildQuizData,
    saveQuiz,
    loadQuiz,
}

async function buildQuizData(props: IBuildQuizProps): Promise<IQuizData> {
    console.log(`[Quiz="${props.quizId}"] data generation start.`)

    const fantasyCountryGenerator = new FantasyCountryDatasetGenerator();

    const dataset = await Promise.all(
        Array.from({ length: props.amountOfCountriesInDS })
            .map(() => fantasyCountryGenerator.generateCountry())
    )

    const datasetPrompt = dataset.map(convertFantasyCountryDataset2Prompt)
        .join("\n\n")

    const quizEntries = Array.from({ length: props.setsOfQuestions })
        .map(() => buildFantasyCountryQuiz(dataset))
        .reduce((prev, curr) => ([...prev, ...curr]), [])

    const quizData = {
        quizId: props.quizId,
        dataset,
        datasetPrompt,
        quizEntries
    }

    console.log(`[Quiz="${props.quizId}"] data generated.`)
    saveQuiz(quizData)
    console.log(`[Quiz="${props.quizId}"] data saved.`)

    return quizData;
}

function saveQuiz(data: IQuizData) {
    const dirPath = path.join("tmp", "quiz", data.quizId, "data");
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }

    writeFileSync(path.join(dirPath, `dataset.json`), JSON.stringify(data.dataset, null, 2))
    writeFileSync(path.join(dirPath, `dataset_prompt.md`), data.datasetPrompt)
    writeFileSync(path.join(dirPath, `quiz.json`), JSON.stringify(data.quizEntries, null, 2))
}

function loadQuiz(quizId: string): IQuizData | null {
    const dirPath = path.join("tmp", "quiz", quizId, "data");
    if (!existsSync(dirPath)) {
        return null;
    }

    const datasetTEXT = readFileSync(path.join(dirPath, `dataset.json`), { encoding: "utf-8" })
    const datasetPromptTEXT = readFileSync(path.join(dirPath, `dataset_prompt.md`), { encoding: "utf-8" })
    const quizTEXT = readFileSync(path.join(dirPath, `quiz.json`), { encoding: "utf-8" })

    if (!datasetTEXT || !datasetPromptTEXT || !quizTEXT)
        return null;

    return {
        quizId,
        dataset: JSON.parse(datasetTEXT),
        datasetPrompt: datasetPromptTEXT,
        quizEntries: JSON.parse(quizTEXT)
    }
}