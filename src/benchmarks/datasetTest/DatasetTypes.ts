export interface IQuizEntry {
    question: string,
    questionNo: number,
    questionSetNo: number,
    answer: string,
    rawData: unknown,
    type: "FACT_RETRIEVAL" | "RELATIONAL_MAPPING" | "RELATIONAL_REASONING" | "AGGREGATION_AND_MATH" | "LOGICAL_FILTERING" | "TOP_K_RANKING"
}