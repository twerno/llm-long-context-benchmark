import { IBuildBenchmarkTestsDataFn, IBuildBenchmarkTestsDataFnParams, ITestData } from "../../benchmark_orchestrator/AbstractBenchmarkRunner";


export interface IHiddenPhraseBenchmarkTestDataBuilderParams extends IBuildBenchmarkTestsDataFnParams {
    textLength: number,
    noOfHiddenPhrases: number
}

export interface IHiddenPhraseTestData extends ITestData {
    hiddenPhrases: string[]
}

export const buildHiddenPhraseData: IBuildBenchmarkTestsDataFn<IHiddenPhraseBenchmarkTestDataBuilderParams, IHiddenPhraseTestData> = async (params: IHiddenPhraseBenchmarkTestDataBuilderParams): Promise<IHiddenPhraseTestData[]> => {

    const FILLER_TEXT = "This is the filler text which has no real meaning."
    const HIDDEN_PHRASE_TEMPLATE_1 = `secret phrase no `
    const HIDDEN_PHRASE_TEMPLATE_2 = ``

    const noOfHiddenPhrases = Math.max(1, params.noOfHiddenPhrases)
    const hiddenPhraseNumerPartLength = Math.floor(Math.log10(noOfHiddenPhrases)) + 1
    const hiddenPhraseTotalLength = noOfHiddenPhrases * (HIDDEN_PHRASE_TEMPLATE_1.length + hiddenPhraseNumerPartLength + HIDDEN_PHRASE_TEMPLATE_2.length)
    const textLength = Math.max(params.textLength, FILLER_TEXT.length)
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

    return [
        {
            testIdx: 0,
            systemPrompt: [fillerTextSB.join(" ")],
            userPrompt: [promptTemplte],
            hiddenPhrases
        }
    ]

}

const promptTemplte = `Identify every occurrence of secret text and answer with "The hidden phrases are: " followed by a comma separated list of the full phrases.`