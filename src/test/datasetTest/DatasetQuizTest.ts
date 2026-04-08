import path from "node:path";
import { ILLMRunner, ILLMRunnerOutput, ILLMRunnerProps } from "../../llmRunner/ILLMRunner";
import { IQuizEntry } from "./DatasetTypes";
import QuizDataUtils, { IQuizData } from "./QuizDataUtils";
import FileUtils from "../../utils/FileUtils";


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
    console.log(`[Quiz="${quizData.quizId}"] [runId=${runId}] starting with dataset size=${quizData.dataset.length}.`)
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

    FileUtils.writeFile(dirPath, `messages.json`, JSON.stringify({ messages, totalTokens: resp?.totalTokens }, null, 2));

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

interface IQuestionEvaluation {
    quizEntry: IQuizEntry,
    llmAnswer: string,
    evaluationResults: boolean[],
    combinedEvaluation: boolean
}
interface IEvaluationResult {
    evaluatedQuestions: IQuestionEvaluation[],
    correct: number,
    total: number
}
async function evaluate(props: IEvaluateProps): Promise<IEvaluationResult> {

    const evaluatedQuestions: IQuestionEvaluation[] = []
    for (let i = 0; i < props.responsesToEvaluate.length; i++) {
        process.stdout.write(`[Quiz="${props.metadata.quizId}"] [runId=${props.metadata.runId}] Evaluating answer for question [${i + 1}/${props.responsesToEvaluate.length}]... `)
        const result = await evaluateResponse(props.responsesToEvaluate[i], i, props);
        evaluatedQuestions.push(result);
        process.stdout.write(` - ${result.combinedEvaluation ? "OK" : "FAIL"}\n`)
    }

    const correct = evaluatedQuestions
        .reduce((prev, curr) => curr ? prev++ : prev, 0);
    return {
        evaluatedQuestions,
        correct,
        total: props.responsesToEvaluate.length,
    }
}

async function evaluateResponse(responseToEvaluate: ILLMResponseToEvaluete, responseIdx: number, props: IEvaluateProps): Promise<IQuestionEvaluation> {
    const repeatEvaluationNTimes = Math.max(1, props.repeatEvaluationNTimes)

    const message = [
        `The hint to help you evaluate the users' answer: "${responseToEvaluate.quizEntry.answer}".`,
        `Check if the given answer below is correct and respond with "TRUE" when it is or "FALSE" otherwise.`,
        `The answer given by user is:\n ${responseToEvaluate.llmAnswer}`
    ].join("\n")

    const evaluationResults: boolean[] = []
    process.stdout.write("[")
    for (let i = 0; i < repeatEvaluationNTimes; i++) {

        // force new session
        const taskId = `taskId=${Math.floor(Math.random() * 1e9)}\n`;
        const resp = await props.llmRunner.run({ messages: [{ role: "user", content: taskId + message }] })

        const evaluationResult = resp.output[0].includes("TRUE") && !resp.output[0].includes("FALSE");
        evaluationResults.push(evaluationResult)

        // log progress
        process.stdout.write(`${i === 0 ? "" : ", "}${evaluationResult ? "OK" : "FAIL"}`)

        FileUtils.writeFile(
            props.metadata.dirPath,
            `evaluation_${responseIdx + 1}__${i + 1}.txt`,
            message + "\n\n ================================= \n" + resp.output[0]
        );
    }
    process.stdout.write("]")

    const combinedEvaluation = evaluationResults.reduce((prev, curr) => prev && curr, true);
    return {
        quizEntry: responseToEvaluate.quizEntry,
        llmAnswer: responseToEvaluate.llmAnswer,
        evaluationResults,
        combinedEvaluation
    }
}


/**
 * Default export containing the test functions
 */
export default {
    getQuizData,
    execute,
    evaluate
}