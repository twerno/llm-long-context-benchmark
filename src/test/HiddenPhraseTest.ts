

/**
 * Interface for generating data parameters
 */
export interface IGenerateDataProps {
    textLength: number,
    noOfHiddenPhrases: number
}

/**
 * Interface for test data structure
 */
export interface ITestData {
    text: string,
    hiddenPhrases: string[]
}

/**
 * Generates test data with hidden phrase
 * @param options - Configuration for generating data
 * @returns Promise resolving to test data including the generated text and hidden text list
 */
async function generateData(options: IGenerateDataProps): Promise<ITestData> {
    const FILLER_TEXT = "This is the filler text which has no real meaning."
    const HIDDEN_PHRASE_TEMPLATE_1 = `secret phrase no `
    const HIDDEN_PHRASE_TEMPLATE_2 = ``

    const noOfHiddenPhrases = Math.max(1, options.noOfHiddenPhrases)
    const hiddenPhraseNumerPartLength = Math.floor(Math.log10(noOfHiddenPhrases)) + 1
    const hiddenPhraseTotalLength = noOfHiddenPhrases * (HIDDEN_PHRASE_TEMPLATE_1.length + hiddenPhraseNumerPartLength + HIDDEN_PHRASE_TEMPLATE_2.length)
    const textLength = Math.max(options.textLength, FILLER_TEXT.length)
    const repetitions = Math.ceil((textLength - hiddenPhraseTotalLength) / FILLER_TEXT.length + 1)


    const fillerTextSB = Array.from({ length: repetitions })
        .map(() => FILLER_TEXT)


    // hidden phrases generation
    const hiddenPhrases: string[] = [];
    for (let i = 0; i < noOfHiddenPhrases; i++) {
        const hiddenPhraseNumberPart = (i + 1).toString().padStart(hiddenPhraseNumerPartLength, "0")
        const hiddenPhrase = HIDDEN_PHRASE_TEMPLATE_1 + hiddenPhraseNumberPart + HIDDEN_PHRASE_TEMPLATE_2

        const position = Math.floor(Math.random() * fillerTextSB.length)
        fillerTextSB.splice(position, 0, hiddenPhrase)
        hiddenPhrases.push(hiddenPhrase);
    }

    return {
        text: fillerTextSB.join(" "),
        hiddenPhrases
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
        data.text,
        "\n\n",
        `Identify every occurrence of secret text and answer with "The hidden phrases are: " followed by a comma separated list of the full phrases.`
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
    const llmPhrases = extractPhrasesFromLlmAnswer(llmAnswer)

    let correct = 0;
    for (const phrase of data.hiddenPhrases) {
        if (llmPhrases.includes(phrase))
            correct++
    }

    const falsePossitive = llmPhrases.length - correct;

    return {
        correct,
        total: data.hiddenPhrases.length + falsePossitive,
        falsePossitive
    }
}

function extractPhrasesFromLlmAnswer(llmAnswer: string[]) {
    const combinedOutput = llmAnswer.join(" ")
    const staringIdx = combinedOutput.lastIndexOf("The hidden phrases are:");
    const resultOutput = combinedOutput.substring(staringIdx + "The hidden phrases are:".length)
    return resultOutput
        .split(",")
        .map(v => v.trim())
}

/**
 * Default export containing the test functions
 */
export default {
    generateData,
    buildPrompt: buildPromptV1,
    evaluate
}