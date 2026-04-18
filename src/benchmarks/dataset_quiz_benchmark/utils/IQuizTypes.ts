export interface IQuizEntry {
    question: string,
    questionInSetIdx: number,
    questionSetIdx: number,
    hint: string,
    rawData: unknown,
    type: QuizQuestionType[],
}

export type QuizQuestionType =
    | "FACT_RETRIEVAL"            // Proste odtwarzanie faktu z pamięci
    | "RELATIONAL_MAPPING"        // Mapowanie relacji między encjami
    | "RELATIONAL_REASONING"      // Wnioskowanie na podstawie relacji
    | "AGGREGATION_AND_SORT"      // Agregacja danych i sortowanie
    | "MATH_SUM"                  // Sumowanie
    | "MATH_DIV"                  // Dzielenie
    | "UNIT_CONVERSION"
    | "REVERSE_SORT"
    | "AGGREGATION"               // Agregacja
    | "LIST_OUTPUT"
    | "LOGICAL_FILTERING"         // Filtrowanie z warunkami logicznymi
    | "TOP_K_RANKING"             // Ranking i sortowanie
    | "MULTI_HOP_REASONING"       // Wnioskowanie wieloetapowe
    | "IMPOSSIBLE";               // Zadania praktycznie nierozwiązalne

