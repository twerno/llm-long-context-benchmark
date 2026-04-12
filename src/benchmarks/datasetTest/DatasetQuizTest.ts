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

async function getQuizData(options: IGenerateDataProps, benchmarkHomeDir: string): Promise<IQuizData> {
    const quizId = `ds_size_${options.datasetSize}__questions_size_${options.setsOfQuestions}`
    const quizData = QuizDataUtils.loadQuiz(quizId, benchmarkHomeDir);
    if (quizData) {
        console.log(`[Quiz="${quizId}"] restored from file.`)
        return quizData;
    }
    const newQuizData = await QuizDataUtils.buildQuizData(
        {
            amountOfCountriesInDS: options.datasetSize,
            quizId,
            setsOfQuestions: options.setsOfQuestions
        },
        benchmarkHomeDir
    )

    return newQuizData;
}


export interface ILLMResponseToEvaluete {
    llmAnswer: string,
    error?: any,
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
        try {
            messages.push({ "role": "user", content: quizEntry.question })
            resp = await llmRunner.run({ messages })
            const llmAnswer = resp.output[0]
            messages.push({ role: "assistant", content: llmAnswer })
            responsesToEvaluate.push({ quizEntry, llmAnswer: llmAnswer })
        } catch (err: any) {
            console.error(err)
            responsesToEvaluate.push({ quizEntry, llmAnswer: "ERROR", error: JSON.stringify(err?.message ?? err) })
        }
    }
    console.log(`Total tokens usage: ${resp?.totalTokens}`)

    FileUtils.writeFile(dirPath, `messages.json`, JSON.stringify({ messages, totalTokens: resp?.totalTokens }, null, 2));
    FileUtils.writeFile(dirPath, `responsesToEvaluate.json`, JSON.stringify(responsesToEvaluate, null, 2));

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
    evaluationStepRuns: number
}

interface IQuestionEvaluation {
    error?: any,
    quizEntry: IQuizEntry,
    llmAnswer: string,
    evaluationResults: boolean[],
    combinedEvaluation: boolean
}
export interface IEvaluationResult {
    evaluatedQuestions: IQuestionEvaluation[],
    correct: number,
    total: number
}
async function evaluate(props: IEvaluateProps): Promise<IEvaluationResult> {

    const evaluatedQuestions: IQuestionEvaluation[] = []
    for (let i = 0; i < props.responsesToEvaluate.length; i++) {
        process.stdout.write(`[Quiz="${props.metadata.quizId}"] [runId=${props.metadata.runId}] Evaluating answer for question [${i + 1}/${props.responsesToEvaluate.length}]... `)
        const respToEvalueate = props.responsesToEvaluate[i];
        try {
            if (respToEvalueate.error) {
                FileUtils.writeFile(
                    props.metadata.dirPath,
                    `evaluation_${i + 1}_skipped.txt`,
                    "Evaluation skilled due to previous errors"
                );
                evaluatedQuestions.push({ ...respToEvalueate, combinedEvaluation: false, evaluationResults: [] });
                process.stdout.write(` - "SKIP"\n`)
                continue;
            }

            const result = await evaluateResponse(props.responsesToEvaluate[i], i, props);

            evaluatedQuestions.push(result);
            process.stdout.write(` - ${result.combinedEvaluation ? "OK" : "FAIL"}\n`)
        } catch (err) {
            console.error(err)
            evaluatedQuestions.push({ ...respToEvalueate, combinedEvaluation: false, evaluationResults: [], error: err });
        }
    }

    const correct = evaluatedQuestions
        .reduce((prev, curr) => prev + (curr.combinedEvaluation ? 1 : 0), 0);
    return {
        evaluatedQuestions,
        correct,
        total: props.responsesToEvaluate.length,
    }
}

async function evaluateResponse(responseToEvaluate: ILLMResponseToEvaluete, responseIdx: number, props: IEvaluateProps): Promise<IQuestionEvaluation> {
    const repeatEvaluationNTimes = Math.max(1, props.evaluationStepRuns)

    const message = messageTemplate
        .replace("<QUESTION>", responseToEvaluate.quizEntry.question)
        .replace("<HINT>", responseToEvaluate.quizEntry.answer)
        .replace("<ANSWER>", responseToEvaluate.llmAnswer);

    const evaluationResults: boolean[] = []
    process.stdout.write("[")
    for (let i = 0; i < repeatEvaluationNTimes; i++) {

        const resp = await props.llmRunner.run({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ]
        })

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

const systemPrompt = `### ROLE
You are a strict grading assistant. Your task is to evaluate if the User's Answer is correct based on the provided Reference Information in response to the Question.

### EVALUATION RULES
1. **Semantic Accuracy:** The User's Answer must be semantically equivalent to the Reference Information. 
2. **Flexibility:** Accept synonyms, different phrasing, and paraphrasing, provided the core fact is correct.
3. **Irrelevant Info:** If the user provides additional information that is outside the scope of the question, ignore it and focus only on whether the core answer is correct.
4. **Typos:** Do not accept answers with spelling errors.
5. **Strictness:** If the user's answer contradicts the Reference Information or is factually incorrect, it must be FALSE.

### OUTPUT FORMAT
Respond ONLY with one of these two words:
- "TRUE" if the answer is correct.
- "FALSE" if the answer is incorrect.

Do not provide any explanations, notes, or extra text.`;

const messageTemplate = `### DATA
- **Question:** "<QUESTION>"
- **Reference Information (Correct Answer/Hint):** "<HINT>"
- **User's Answer:** "<ANSWER>"`;