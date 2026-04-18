export interface IQuizEntry {
    question: string,
    questionInSetIdx: number,
    questionSetIdx: number,
    hint: string,
    rawData: unknown,
    type: QuizQuestionType[],
    intent: string, // Nowe pole opisujące cel testu
}

export type QuizQuestionType =
    | "FACT_RETRIEVAL"            // Proste odtwarzanie faktu z pamięci
    | "RELATIONAL_MAPPING"        // Mapowanie relacji między encjami
    | "RELATIONAL_REASONING"      // Wnioskowanie na podstawie relacji
    | "AGGREGATION_AND_MATH"      // Agregacja danych i obliczenia
    | "AGGREGATION"               // Agregacja
    | "LOGICAL_FILTERING"         // Filtrowanie z warunkami logicznymi
    | "TOP_K_RANKING"             // Ranking i sortowanie
    | "MULTI_HOP_REASONING"       // Wnioskowanie wieloetapowe
    | "IMPOSSIBLE";               // Zadania praktycznie nierozwiązalne