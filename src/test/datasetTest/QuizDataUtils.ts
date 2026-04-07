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

    const datasetPrompt = [
        ...factsToInsert.datasetPropt.start,
        ...dataset.map(convertFantasyCountryDataset2Prompt),
        ...factsToInsert.datasetPropt.end
    ].join("\n\n")

    const quizEntries = Array.from({ length: props.setsOfQuestions })
        .map(() => buildFantasyCountryQuiz(dataset))
        .reduce((prev, curr) => ([...prev, ...curr]), [])

    quizEntries.push(...factsToInsert.quizEntries)

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

const factsToInsert: { datasetPropt: { start: string[], end: string[] }, quizEntries: IQuizEntry[] } = {
    datasetPropt: {
        start: [
            `FACT: The highest mountain across all counties is QuiraNidram and it's 2565 meters high.`,
            `FACT: The deepest lake across all counties is Kzu'La and it's 7654 meters deep.`
        ],
        end: [
            `FACT: The highest mountain across all counties is TirumKrak and it's 3451 meters high.`,
            `FACT: The deepest lake across all counties is Apornonio and it's 3123 meters deep.`
        ]
    },
    quizEntries: [
        {
            question: "What is the name of the highest mountain?",
            answer: "The highest mouintain is the TirumKrak",
            rawData: "TirumKrak"
        },
        {
            question: "How high is the highest mountain?",
            answer: "The highest mouintain is 3451 meters high",
            rawData: 3451
        },
        {
            question: "What is the name of the deepest lake?",
            answer: "The deepest lake is Kzu'La",
            rawData: "Kzu'La"
        },
        {
            question: "What is the deep of the deepest lake?",
            answer: "The deepest lake is 7654 meters deep",
            rawData: "7654"
        }
    ]

}