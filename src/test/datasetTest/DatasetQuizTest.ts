import path from "node:path";
import { ILLMRunner, ILLMRunnerOutput, ILLMRunnerProps } from "../../llmRunner/ILLMRunner";
import { IQuizEntry } from "./DatasetTypes";
import QuizDataUtils, { IQuizData } from "./QuizDataUtils";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";


/**
 * Interface for generating data parameters
 */
export interface IGenerateDataProps {
    datasetSize: number,
    setsOfQuestions: number
}

async function getQuizData(options: IGenerateDataProps): Promise<IQuizData> {
    const quizId = `ds_size_${options.datasetSize}__questions_size_${options.setsOfQuestions}`
    const quizData = QuizDataUtils.loadQuiz(quizId);
    if (quizData) {
        console.log(`[Quiz="${quizId}"] restored from file.`)
        return quizData;
    }
    const newQuizData = await QuizDataUtils.buildQuizData(
        {
            amountOfCountriesInDS: options.datasetSize,
            quizId,
            setsOfQuestions: options.setsOfQuestions
        }
    )

    return newQuizData;
}


export interface ILLMResponseToEvaluete {
    llmAnswer: string,
    quizEntry: IQuizEntry
}

interface IExecureProps {
    runId: string,
    dirPath: string,
    quizData: IQuizData,
    llmRunner: ILLMRunner
}

async function execute({ llmRunner, quizData, runId, dirPath }: IExecureProps): Promise<ILLMResponseToEvaluete[]> {
    const responsesToEvaluate: ILLMResponseToEvaluete[] = []

    const messages: ILLMRunnerProps["messages"] = [{ role: "user", content: quizData.datasetPrompt }]

    let resp: ILLMRunnerOutput | undefined

    for (let i = 0; i < quizData.quizEntries.length; i++) {
        console.log(`[Quiz="${quizData.quizId}"] [runId=${runId}] testing [${i + 1}/${quizData.quizEntries.length}].`)

        const quizEntry = quizData.quizEntries[i]

        messages.push({ "role": "user", content: quizEntry.question })
        resp = await llmRunner.run({ messages })
        const llmAnswer = resp.output[0]
        messages.push({ role: "assistant", content: llmAnswer })
        responsesToEvaluate.push({ quizEntry, llmAnswer: llmAnswer })
    }
    console.log(`Total tokens usage: ${resp?.totalTokens}`)

    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
    writeFileSync(path.join(dirPath, `messages.json`), JSON.stringify({ messages, totalTokens: resp?.totalTokens }, null, 2))

    return responsesToEvaluate;
}

interface IEvaluateProps {
    metadata: {
        runId: string,
        quizId: string,
        dirPath: string
    },
    llmRunner: ILLMRunner,
    responsesToEvaluate: ILLMResponseToEvaluete[],
    repeatEvaluationNTimes: number
}
async function evaluate(props: IEvaluateProps) {

    let correct = 0;

    for (let i = 0; i < props.responsesToEvaluate.length; i++) {
        process.stdout.write(`[Quiz="${props.metadata.quizId}"] [runId=${props.metadata.runId}] Evaluating answer for question [${i + 1}/${props.responsesToEvaluate.length}]... `)
        const result = await evaluateResponse(props.responsesToEvaluate[i], i, props);
        process.stdout.write(` - ${result ? "OK" : "FAIL"}\n`)
        if (result) correct++;
    }

    return {
        correct,
        total: props.responsesToEvaluate.length,
        falsePossitive: undefined
    }
}

async function evaluateResponse(responseToEvaluate: ILLMResponseToEvaluete, responseIdx: number, props: IEvaluateProps) {
    const repeatEvaluationNTimes = Math.min(Math.max(1, props.repeatEvaluationNTimes), 10)

    const message = [
        `The correct answer is as follows "${responseToEvaluate.quizEntry.answer}".`,
        `Check if the given answer below is correct and respond with "TRUE" when it is or "FALSE" otherwise.`,
        `The given answer is: "${responseToEvaluate.llmAnswer}"`
    ].join("\n")

    process.stdout.write("[")
    let finalEvaluation = true;
    for (let i = 0; i < repeatEvaluationNTimes; i++) {

        const taskId = `taskId=${Math.floor(Math.random() * 1e9)}\n`;
        const resp = await props.llmRunner.run({ messages: [{ role: "user", content: taskId + message }] })

        const evaluationResult = resp.output[0].includes("TRUE") && !resp.output[0].includes("FALSE");
        finalEvaluation = finalEvaluation && evaluationResult;

        process.stdout.write(`${i === 0 ? "" : ", "}${evaluationResult ? "OK" : "FAIL"}`)

        if (!existsSync(props.metadata.dirPath)) {
            mkdirSync(props.metadata.dirPath, { recursive: true });
        }
        writeFileSync(
            path.join(props.metadata.dirPath, `evaluation_${responseIdx + 1}__${i + 1}.txt`),
            message + "\n\n ================================= \n" + resp.output[0]
        )
    }
    process.stdout.write("]")
    return finalEvaluation;
}


/**
 * Default export containing the test functions
 */
export default {
    getQuizData,
    execute,
    evaluate
}