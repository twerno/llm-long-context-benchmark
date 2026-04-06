import { existsSync, mkdirSync, writeFileSync, } from "node:fs";
import { LMStudioApiRunner } from "./llmRunner/APILLMRunner";
import { generateCountry } from "./test/datasetTest/datasetBuilder/DatasetGenerator";
import HiddenTextTest from "./test/HiddenPhraseTest";
import SequenceOfNumbersTest from "./test/SequenceOfNumbersTest"
import { convertToPrompt } from "./test/datasetTest/datasetBuilder/Dataset2PromptConverter";
import { buildQuestions as buildTestQuestionsAndAnswers } from "./test/datasetTest/datasetBuilder/QuestionsBuilder";
import { ILLMRunnerProps } from "./llmRunner/ILLMRunner";
import path from "node:path";

async function test() {

  // let resp = await LMStudioApiRunner.run({ prompt: ["Poland is the capital city of which country?"] })
  // console.log(resp);

  // let resp = await LMStudioApiRunner.run({ prompt: ["Imagine 600 names of fictional pokemon like creatures, answer with the coma separated list of names. Be creative."] })
  // console.log(resp);
  // await testHiddenText();

  await generateCountries();
}

test()

async function testSequenceOfNumbers() {
  const testPrompt = await SequenceOfNumbersTest.buildPrompt({ sequenceLength: 1820, noOfGaps: 2 })
  // console.log(testPrompt.prompt)
  let resp = await LMStudioApiRunner.run({ messages: [{ role: 'user', content: testPrompt.prompt }] })
  const evaluate = await SequenceOfNumbersTest.evaluate(resp.output, testPrompt.data)
  // console.log(testPrompt.data.missingNumbers)
  console.log(resp)
  console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

async function testHiddenText() {
  const testPrompt = await HiddenTextTest.buildPrompt({ textLength: 100000, noOfHiddenPhrases: 200 })
  console.log(testPrompt.prompt)
  let resp = await LMStudioApiRunner.run({ messages: [{ role: 'user', content: testPrompt.prompt }] })
  const evaluate = await HiddenTextTest.evaluate(resp.output, testPrompt.data)
  console.log(testPrompt.data.hiddenPhrases)
  console.log(resp)
  console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

async function generateCountries() {
  const dataset = await Promise.all(
    [
      generateCountry(),
    ]
  );
  const dateTimeStamp = new Date().toISOString().replace(/:/g, "_")

  const dirPath = path.join("tmp", dateTimeStamp);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  writeFileSync(path.join(dirPath, `dataset.json`), JSON.stringify(dataset, null, 2))
  const prompt = dataset.map(convertToPrompt).join("\n\n")
  writeFileSync(path.join(dirPath, `prompt.md`), prompt)
  const testQAndAList = buildTestQuestionsAndAnswers(dataset);

  // send questions
  const messages: ILLMRunnerProps["messages"] = [{ role: "user", content: prompt }]
  const responsesToEvaluate: { content: string, testQAndA: typeof testQAndAList[number] }[] = []
  for (const testQAndA of testQAndAList) {
    messages.push({ "role": "user", content: testQAndA.question })
    let resp = await LMStudioApiRunner.run({ messages })
    const content = resp.output[0]
    messages.push({ role: "assistant", content })
    responsesToEvaluate.push({ testQAndA, content })
  }
  writeFileSync(path.join(dirPath, `messages.txt`), JSON.stringify(messages, null, 2))

  // evaluate
  let correct = 0;
  let unknown = 0;
  let i = 1;
  for (const respToEvaluate of responsesToEvaluate) {
    const message = `The correct answer to the question should be "${respToEvaluate.testQAndA.answer}". 
    Check if the answer below is correct one and respond with "TRUE" iwhen it is or "FALSE" otherwise.\n
    The given answer is: "${respToEvaluate.content}"`
    let resp = await LMStudioApiRunner.run({ messages: [{ role: "user", content: message }] })
    writeFileSync(path.join(dirPath, `${i++}.txt`), message + "\n\n ================================= \n" + resp.output[0])
    if (resp.output[0].includes("TRUE")) correct++;
  }

  console.log(`[${correct}/${responsesToEvaluate.length}]`)
} 