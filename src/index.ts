import { LMStudioApiRunner } from "./llmRunner/APILLMRunner";
import HiddenTextTest from "./test/HiddenPhraseTest";
import SequenceOfNumbersTest from "./test/SequenceOfNumbersTest"

async function test() {

  // let resp = await LMStudioApiRunner.run({ prompt: ["Poland is the capital city of which country?"] })
  // console.log(resp);

  await testHiddenText();

}

test()

async function testSequenceOfNumbers() {
  const testPrompt = await SequenceOfNumbersTest.buildPrompt({ sequenceLength: 1820, noOfGaps: 2 })
  // console.log(testPrompt.prompt)
  let resp = await LMStudioApiRunner.run({ prompt: [testPrompt.prompt] })
  const evaluate = await SequenceOfNumbersTest.evaluate(resp.output, testPrompt.data)
  // console.log(testPrompt.data.missingNumbers)
  console.log(resp)
  console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

async function testHiddenText() {
  const testPrompt = await HiddenTextTest.buildPrompt({ textLength: 100000, noOfHiddenPhrases: 200 })
  console.log(testPrompt.prompt)
  let resp = await LMStudioApiRunner.run({ prompt: [testPrompt.prompt] })
  const evaluate = await HiddenTextTest.evaluate(resp.output, testPrompt.data)
  console.log(testPrompt.data.hiddenPhrases)
  console.log(resp)
  console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}