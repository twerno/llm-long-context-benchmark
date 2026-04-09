

/**
 * Interface for generating data parameters
 */
export interface IGenerateDataProps {
    /** Length of the sequence to generate */
    sequenceLength: number,
    /** Number of gaps (missing numbers) in the sequence */
    noOfGaps: number
}

/**
 * Interface for test data structure
 */
export interface ITestData {
    /** sequence of natural numbers 0...fullSequenceLength-1 - with gaps */
    sequenceWithGaps: number[],
    /** Full length of the original sequence */
    fullSequenceLength: number,
    /** Array of missing numbers */
    missingNumbers: number[]
}

/**
 * Generates test data with gaps in a sequence
 * @param options - Configuration for generating data
 * @returns Promise resolving to test data including the sequence, full length and missing numbers
 */
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


/**
 * Builds a prompt version 1 for testing
 * @param options - Configuration parameters for generating the prompt
 * @returns Promise resolving to an object containing the generated prompt and associated data
 */
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
/**
 * Builds a prompt version 2 for testing
 * @param options - Configuration parameters for generating the prompt
 * @returns Promise resolving to an object containing the generated prompt and associated data
 */
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

/**
 * Builds a prompt version 3 for testing
 * @param options - Configuration parameters for generating the prompt
 * @returns Promise resolving to an object containing the generated prompt and associated data
 */
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

/**
 * Evaluates LLM response against expected results
 * @param llmAnswer - Array of strings representing the LLM's answer
 * @param data - Test data containing information about missing numbers
 * @returns Evaluation result object with correct count, total count and false positive count
 */
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

/**
 * Extracts numbers from LLM response string
 * @param llmAnswer - Array of strings representing the LLM's answer
 * @returns Array of extracted number strings, or null if no match found
 */
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

/**
 * Default export containing the test functions
 */
export default {
    generateData,
    buildPrompt: buildPromptV2,
    evaluate
}