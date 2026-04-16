export interface IQuizEntry {
    question: string,
    questionInSetIdx: number,
    questionSetIdx: number,
    hint: string,
    rawData: unknown,
    type: "FACT_RETRIEVAL" | "RELATIONAL_MAPPING" | "RELATIONAL_REASONING" | "AGGREGATION_AND_MATH" | "LOGICAL_FILTERING" | "TOP_K_RANKING" | "IMPOSSIBLE"
}