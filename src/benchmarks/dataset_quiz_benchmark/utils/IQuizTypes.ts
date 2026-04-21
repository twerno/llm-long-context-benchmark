export interface IQuizEntry {
    question: string,
    questionInSetIdx: number,
    questionSetIdx: number,
    hint: string,
    rawData: unknown,
    type: QuizQuestionType[],
}

/**
 * QuizQuestionType represents the dimensions of a question.
 * It is recommended to use a combination of tags: [Logic, Format, Modifier]
 */
export type QuizQuestionType =
    // --- LOGIC (The core reasoning required) ---
    | "FACT_RETRIEVAL"            // Simple retrieval of a single fact
    | "RELATIONAL_MAPPING"        // Mapping relations between entities (e.g., city -> country)
    | "MULTI_HOP_REASONING"       // Multi-step reasoning (e.g., city -> province -> country)
    | "LOGICAL_FILTERING"         // Filtering a set based on logical conditions
    | "COMPARISON"                // Comparing values (largest, smallest, most frequent)
    | "AGGREGATION"               // Mathematical operations on sets (sum, count, average)
    | "MULTIPLE_FACTS"            // Requiring multiple independent facts in one answer

    // --- FORMAT (The expected output structure) ---
    | "SCALAR_OUTPUT"             // A single value (string, number, etc.)
    | "LIST_OUTPUT"               // An unordered list of elements
    | "SORTED_LIST"               // A list that must be in a specific order
    | "BOOLEAN_OUTPUT"            // Yes/No or True/False answer

    // --- MODIFIERS (Additional complexity layers) ---
    | "UNIT_CONVERSION";          // Requires changing units (e.g., kg to g)
