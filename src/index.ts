import path from "node:path";
import { LMStudioApiRunner } from "./llmRunner/APILLMRunner";
import HiddenTextTest from "./test/HiddenPhraseTest";
import SequenceOfNumbersTest from "./test/SequenceOfNumbersTest";
import DatasetQuizTest from "./test/datasetTest/DatasetQuizTest";
import { LlamaServerRunner } from "./llmRunner/LlamaServerRunner";


async function test() {

    const server = new LlamaServerRunner({
        executablePath: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
        modelPath: "D:/modele AI/LM Studio/speakleash/Bielik-4.5B-v3.0-Instruct-GGUF/Bielik-4.5B-v3.0-Instruct.Q8_0.gguf",
        model: "Bielik-4.5B-v3.0-Instruct.Q8_0.gguf",
        host: "127.0.0.1",
        port: 5000,
    });
    try {
        await server.start();
        let resp = await server.run({ messages: [{ role: "user", content: "Poland is the capital city of which country?" }] })
        console.log(resp);
    } finally {
        server.stop();
    }


    // let resp = await LMStudioApiRunner.run({ prompt: ["Imagine 600 names of fictional pokemon like creatures, answer with the coma separated list of names. Be creative."] })
    // console.log(resp);
    // await testHiddenText();

    // await testSequenceOfNumbers();
    // await testHiddenText();
    // await datasetQuizTest();
}

test()

async function testSequenceOfNumbers() {
    const testPrompt = await SequenceOfNumbersTest.buildPrompt({ sequenceLength: 1820, noOfGaps: 2 })
    // console.log(testPrompt.prompt)
    let resp = await LMStudioApiRunner.run({ messages: [{ role: 'user', content: testPrompt.prompt }] })
    const evaluate = await SequenceOfNumbersTest.evaluate(resp.output, testPrompt.data)
    console.log(`missing numbers: [${testPrompt.data.missingNumbers.join(", ")}]`)
    console.log(resp)
    console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

async function testHiddenText() {
    const testPrompt = await HiddenTextTest.buildPrompt({ textLength: 100000, noOfHiddenPhrases: 200 })
    // console.log(testPrompt.prompt)
    let resp = await LMStudioApiRunner.run({ messages: [{ role: 'user', content: testPrompt.prompt }] })
    const evaluate = await HiddenTextTest.evaluate(resp.output, testPrompt.data)
    console.log(testPrompt.data.hiddenPhrases)
    console.log(resp)
    console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

async function datasetQuizTest() {
    const quizData = await DatasetQuizTest
        .getQuizData({ datasetSize: 2, setsOfQuestions: 1 })

    const runId = new Date().toISOString().replace(/:/g, "_");
    const dirPath = path.join("tmp", "quiz", quizData.quizId, "results", runId);
    const responsesToEvaluate = await DatasetQuizTest.execute({ runId, quizData, llmRunner: LMStudioApiRunner, dirPath })

    const evaluationResult = await DatasetQuizTest.evaluate({
        metadata: { runId, quizId: quizData.quizId, dirPath },
        repeatEvaluationNTimes: 2,
        llmRunner: LMStudioApiRunner,
        responsesToEvaluate,
    })

    console.log(`[${evaluationResult.correct}/${responsesToEvaluate.length}]`)
} 
