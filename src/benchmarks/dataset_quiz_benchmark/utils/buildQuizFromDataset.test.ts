import { describe, it, expect } from "vitest";
import FantasyCountryDatasetGenerator from "../dataset_generator/FantasyCountryDatasetGenerator";
import buildQuizFromDataset from "./buildQuizFromDataset";

describe('buildQuizFromDataset and FantasyCountryDatasetGenerator integration tests', () => {
    const generator = new FantasyCountryDatasetGenerator();

    const testSizes = [1, 2, 5, 10, 50, 100, 200];

    testSizes.forEach(size => {
        it(`should work for dataset size ${size} and return 20 questions`, async () => {
            // 1. Generate a dataset of the specified size
            const dataset: any[] = [];
            for (let i = 0; i < size; i++) {
                dataset.push(await generator.generateCountry());
            }

            // 2. Build quiz from this dataset
            // We use setIdx 0 for all of them
            const quiz = buildQuizFromDataset(dataset, 0);

            // 3. Assertions
            // The requirement is: "czy tablica zwraca odpowiednia liczbe elekmentow"
            // Based on buildQuizFromDataset implementation, it always returns 20 questions.
            expect(quiz).toBeDefined();
            expect(Array.isArray(quiz)).toBe(true);
            expect(quiz.length).toBe(20);

            // Also check if it runs without exceptions (implicit in the test running)
        });
    });
});
