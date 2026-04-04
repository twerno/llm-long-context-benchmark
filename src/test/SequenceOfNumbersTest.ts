

export interface IGenerateDataProps {
    sequenceLength: number,
    noOfGaps: number
}

export interface ITestData {
    sequenceWithGaps: number[],
    fullSequenceLength: number,
    missingNumbers: number[]
}

async function generateData(options: IGenerateDataProps): Promise<ITestData> {
    const noOfGaps = Math.max(1, Math.min(options.noOfGaps, options.sequenceLength - 1))
    const fullSequenceLength = Math.max(1 + noOfGaps, Math.min(options.sequenceLength, Number.MAX_SAFE_INTEGER));
    const sequenceWithGaps = Array.from({ length: fullSequenceLength }, (_, idx) => idx);
    const missingNumbers: number[] = [];
    for (let i = 0; i < noOfGaps; i++) {
        const idx = Math.floor(Math.random() * sequenceWithGaps.length);
        sequenceWithGaps.splice(idx, 1)
            .forEach(v => missingNumbers.push(v))
    }
    return {
        sequenceWithGaps,
        fullSequenceLength,
        missingNumbers
    }
}


async function buildPromptV1(options: IGenerateDataProps) {
    const data = await generateData(options);
    const prompt = [
        data.sequenceWithGaps.join(", "),
        "\n\n",
        `That is the sequence 0 to ${data.fullSequenceLength - 1} with some numbers missing. Answer with "The missing numbers are: " followed by the list of the missing numbers.`,
    ].join("")

    return {
        prompt,
        data
    }
}
async function buildPromptV2(options: IGenerateDataProps) {
    const data = await generateData(options);
    const prompt = [
        `This is the sequence of natural numbers from 0 to ${data.fullSequenceLength - 1} with some numbers missing.`,
        "\n",
        data.sequenceWithGaps.join(", "),
        "\n\n",
        `Identify the missing numbers and answer with "The missing numbers are: " followed by a comma separated list of the missing numbers.`
    ].join("")

    return {
        prompt,
        data
    }
}

async function buildPromptV3(options: IGenerateDataProps) {
    const data = await generateData(options);
    const prompt = [
        `This is the sequence of natural numbers from 0 to ${data.fullSequenceLength - 1} with some of them missing.`,
        "\n",
        data.sequenceWithGaps.join(", "),
        "\n\n",
        `Iterate through all numbers from 0 to ${data.fullSequenceLength - 1}, and for each number check whether it appears in the sequence.`,
        "\n",
        `Answer with "The missing numbers are: " followed by a comma separated list of the missing numbers.`
    ].join("")

    return {
        prompt,
        data
    }
}

async function evaluate(llmAnswer: string[], data: ITestData) {
    const llmNumbers = getNumbersFromLlmAnswer(llmAnswer)
    if (!llmNumbers)
        return {
            correct: 0,
            total: data.missingNumbers.length,
            falsePossitive: 0
        }

    let correct = 0;
    for (const missingNumber of data.missingNumbers) {
        if (llmNumbers.includes(missingNumber.toString()))
            correct++
    }

    const falsePossitive = llmNumbers.length - correct;

    return {
        correct,
        total: data.missingNumbers.length + falsePossitive,
        falsePossitive
    }
}

function getNumbersFromLlmAnswer(llmAnswer: string[]) {
    const regExpr = /The missing numbers are: ([\d\s,]+)/g

    const combinedOutput = llmAnswer.join(" ")
    const staringIdx = combinedOutput.lastIndexOf("The missing numbers are:");
    const resultOutput = combinedOutput.substring(staringIdx)
    const regExprGroups = regExpr.exec(resultOutput)
    if (!regExprGroups || regExprGroups.length < 2) {
        return null;
    }
    const results = regExprGroups[1]
        .replace(/\s+/g, "")
        .split(",")

    return results;
}

export default {
    generateData,
    buildPrompt: buildPromptV2,
    evaluate
}