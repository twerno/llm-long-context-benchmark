import { LMStudioApiRunner } from "./llmRunner/APILLMRunner";
import SequenceOfNumbersTest from "./test/SequenceOfNumbersTest"

async function test() {

  // let resp = await LMStudioApiRunner.run({ prompt: ["Poland is the capital city of which country?"] })
  // console.log(resp);

  const testPrompt = await SequenceOfNumbersTest.buildPrompt({ sequenceLength: 1820, noOfGaps: 2 })
  // console.log(testPrompt.prompt)
  let resp = await LMStudioApiRunner.run({ prompt: [testPrompt.prompt] })
  const evaluate = await SequenceOfNumbersTest.evaluate(resp.output, testPrompt.data)
  // console.log(testPrompt.data.missingNumbers)
  console.log(resp)
  console.log(`Result: correct [${evaluate.correct}/${evaluate.total}] false possitive: ${evaluate.falsePossitive}`)
}

test()