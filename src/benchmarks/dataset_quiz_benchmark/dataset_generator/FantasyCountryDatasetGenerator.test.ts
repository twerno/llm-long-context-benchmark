import { describe, it } from "vitest";
import FantasyCountryDatasetGenerator from "./FantasyCountryDatasetGenerator";

describe('FantasyCountryDatasetGenerator', () => {

    const generator = new FantasyCountryDatasetGenerator()

    it('should be able to create 256 unique datasets', async () => {

        for (let i = 0; i < 256; i++) {
            generator.generateCountry();
        }

    });
})