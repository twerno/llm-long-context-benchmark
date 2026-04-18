import { IQuizEntry as IQuizQuestion } from "./IQuizTypes";
import { ICountrySchema } from "../dataset_generator/FantasyCountryDatasetTypes";
import { default as dsUtils } from "./DatasetUtils";

/**
 * Builds a quiz from the provided fantasy country dataset.
 *
 * @param dataset - An array of country schemas to generate questions from.
 * @returns An array of quiz entries containing questions and answers.
 */
export default function buildQuizFromDataset(dataset: ICountrySchema[], setIdx: number): IQuizQuestion[] {
    let idx = 0;

    const questionIdxGenerator = () => idx++
    return [
        ...build10SimpleQuestions(dataset, questionIdxGenerator, setIdx),
        ...buildComplexQuestions(dataset, questionIdxGenerator, setIdx),
        ...buildTrickyQuestions(dataset, questionIdxGenerator, setIdx),
        ...buildImpossiblesQuestions(dataset, questionIdxGenerator, setIdx)
    ]; // USUNIĘTE: .filter((_, idx) => idx <= 0) - to powodowało zwracanie tylko 1 pytania!
}

/**
 * Generates 10 simple questions based on the provided dataset.
 */
function build10SimpleQuestions(dataset: ICountrySchema[], questionIdxGenerator: () => number, setIdx: number): IQuizQuestion[] {
    const quizEntries: IQuizQuestion[] = [];

    // 1 - OCENA: Dobre podstawowe pytanie
    let country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the full name of the ruler of the ${country.name}?`,
        hint: `FACT: The ruler of the country "${country.name}" is "${country.ruler}".`,
        rawData: country.ruler,
        type: ["FACT_RETRIEVAL"],
        intent: "Tests direct recall of a single attribute (ruler name) associated with a country entity."
    })

    // 2 - OCENA: Dobre, testuje zapamiętanie listy
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the colors of the ${country.name}?`,
        hint: `FACT: The colors of the country "${country.name}" are ${country.flagColors.join(", ")}.`,
        rawData: country.flagColors,
        type: ["FACT_RETRIEVAL"],
        intent: "Tests recall of a multi-value attribute (list of colors) for a specific country."
    })

    // 3 - OCENA: Dobre podstawowe pytanie
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the state system of the ${country.name}?`,
        hint: `FACT: The state system of the country "${country.name}" is "${country.stateSystem}".`,
        rawData: country.stateSystem,
        type: ["FACT_RETRIEVAL"],
        intent: "Tests recall of governmental structure type for a given country."
    })

    // 4 - OCENA: Mogłoby być ciekawsze - wymaga liczenia
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `How many provinces has the ${country.name}?`,
        hint: `FACT: There are ${country.province.length} provinces in the country "${country.name}".`,
        rawData: `${country.province.length}`,
        type: ["FACT_RETRIEVAL", "AGGREGATION_AND_MATH"],
        intent: "Tests ability to count nested entities (provinces) within a country, requiring basic aggregation."
    })

    // 5 - OCENA: Bardzo dobre - odwrócona relacja
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `In which country is the ${province.name} province located?`,
        hint: `FACT: The province "${province.name}" is located in the country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING"],
        intent: "Tests reverse lookup - finding parent entity (country) from child entity (province)."
    })

    // 6 - OCENA: Dobre, testuje zagnieżdżoną listę
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the names of the resources produced in ${province.name}?`,
        hint: `FACT: The province "${province.name}" of the country "${country.name}" produces the following resources: ${province.resources.map(p => p.type).join(", ")}.`,
        rawData: province.resources.map(p => p.type),
        type: ["FACT_RETRIEVAL"],
        intent: "Tests recall of nested list (resources within a province), requiring traversal of object hierarchy."
    })

    // 7 - OCENA: Dobre
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the cities in ${province.name}?`,
        hint: `FACT: The "${province.name}" province of the country "${country.name}" has the following cities: ${province.cities.map(c => c.name).join(", ")}.`,
        rawData: province.cities.map(c => c.name),
        type: ["FACT_RETRIEVAL"],
        intent: "Tests recall of nested entities (cities) within a province."
    })

    // 8 - OCENA: Bardzo dobre - odwrócona relacja
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is ruled by ${country.ruler}?`,
        hint: `FACT: "${country.ruler}" is the ruler of country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING"],
        intent: "Tests reverse lookup - finding country from ruler name, testing bidirectional relationship recall."
    })

    // 9 - OCENA: Bardzo dobre - wielopoziomowe mapowanie
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let city = dsUtils.pickOne(province.cities);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `In which country is the city of ${city.name} located?`,
        hint: `FACT: The city of "${city.name}" is located in the country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING", "MULTI_HOP_REASONING"],
        intent: "Tests multi-level reverse lookup (city -> province -> country), requiring traversal up the hierarchy."
    })

    // 10 - OCENA: Dobre podstawowe pytanie
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the area of the ${province.name}?`,
        hint: `FACT: The area of the province "${province.name}" is ${province.area} square kilometers.`,
        rawData: `${province.area}`,
        type: ["FACT_RETRIEVAL"],
        intent: "Tests recall of a numeric attribute (area) for a specific province."
    })
    return quizEntries;
}

/**
 * Complex questions requiring aggregation, filtering, or multi-step reasoning.
 */
function buildComplexQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1 - OCENA: Bardzo dobre - wymaga porównania
    let country = dataset.sort((a, b) => a.area - b.area).reverse()[0];
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country has the largest area?`,
        hint: `FACT: Country "${country.name}" has the largest area.`,
        rawData: country.name,
        type: ["AGGREGATION_AND_MATH"],
        intent: "Tests ability to compare numeric values across all countries and identify maximum."
    })

    // 2 - OCENA: Bardzo dobre - łączy agregację z listą
    country = dataset.sort((a, b) => a.area - b.area)[0];
    let cities = country.province.map(p => p.cities.map(c => c.name)).reduce((prev, curr) => [...prev, ...curr], [])
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List all cities of the country with the smallest area?`,
        hint: `FACT: Cities of the smallest country ("${country.name}") are ${dsUtils.joinList(cities)}.`,
        rawData: cities,
        type: ["AGGREGATION_AND_MATH", "MULTI_HOP_REASONING"],
        intent: "Tests compound reasoning: find minimum area country, then retrieve all its cities across provinces."
    })

    // 3 - OCENA: Świetne - skomplikowane filtrowanie z wieloma warunkami
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province)
    let criminalRate = dsUtils.pickOne(province.crimeRates)
    let color = dsUtils.pickOne(country.flagColors);
    let countries = dataset.filter(c => c.flagColors.includes(color))
    let provinces = countries.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .filter(p => p.crimeRates.find(c => c.type === criminalRate.type && c.rate <= criminalRate.rate))

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List all provinces that belong to a country with ${color} in its flag and has a criminal rate of ${criminalRate.type} less than or equal to ${criminalRate.rate}.`,
        hint: `FACT: The provinces are: ${dsUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name),
        type: ["LOGICAL_FILTERING", "MULTI_HOP_REASONING"],
        intent: "Tests complex multi-condition filtering: flag color match AND specific crime rate threshold, across hierarchy levels."
    })

    // 4 - OCENA: Bardzo dobre - agregacja z potencjalnym remisem
    let countriesAndCities = dataset
        .map(c => ({
            name: c.name,
            cities: c.province
                .map(p => p.cities)
                .reduce((prev, curr) => [...prev, ...curr], [])
        }))
        .sort((a, b) => a.cities.length - b.cities.length)
        .reverse()
        .filter((c, _, arr) => c.cities.length === arr[0].cities.length)

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `What country has the greatest numbers of cities?`,
        hint: countriesAndCities.length === 1
            ? `FACT: The country with greatest numbers of cities is "${countriesAndCities[0].name}"`
            : `FACT: There are ${countriesAndCities.length} countries with the greatest numbers of cities: ${dsUtils.joinList(countriesAndCities.map(c => c.name))}.`,
        rawData: countriesAndCities.map(c => c.name),
        type: ["AGGREGATION_AND_MATH", "MULTI_HOP_REASONING"],
        intent: "Tests aggregation of nested entities (cities across provinces) and comparison to find maximum, handling potential ties."
    })

    // 5 - OCENA: Dobre - proste Yes/No z filtrowanie
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let province2 = dsUtils.pickOne(country.province);
    let fauna = dsUtils.pickOne(province2.fauna);
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Does ${fauna} live in ${province.name}? Answer with 'Yes' or 'No'.`,
        hint: province.fauna.includes(fauna)
            ? `A simple 'yes' as an answer is sufficient; FACT: "Fauna '${fauna}' does live in the province of '${province.name}'".`
            : `A simple 'no' as an answer is sufficient; FACT: "Fauna '${fauna}' doesn't live in the province of '${province.name}'".`,
        rawData: province.fauna.includes(fauna),
        type: ["LOGICAL_FILTERING"],
        intent: "Tests boolean membership check in a list (fauna) for a specific province."
    })

    // 6 - OCENA: Dobre - proste Yes/No z filtrowanie
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    province2 = dsUtils.pickOne(country.province);
    let flora = dsUtils.pickOne(province2.flora);
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Does ${flora} grow in ${province.name}? Answer with 'Yes' or 'No'.`,
        hint: province.flora.includes(flora)
            ? `A simple 'yes' as an answer is sufficient; FACT: "Flora '${flora}' does grow in the province of '${province.name}'".`
            : `A simple 'no' as an answer is sufficient; FACT: "Flora '${flora}' doesn't grow in the province of '${province.name}'".`,
        rawData: province.flora.includes(flora),
        type: ["LOGICAL_FILTERING"],
        intent: "Tests boolean membership check in a list (flora) for a specific province."
    })

    return quizEntries;
}

/**
 * These questions test model's ability to perform computations on memorized data.
 */
function buildTrickyQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1 - OCENA: Świetne - wymaga obliczeń density
    let province = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .reverse()[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which province is the most densely populated?`,
        hint: `The most densely populated province is ${province.name}`,
        rawData: province.name,
        type: ["AGGREGATION_AND_MATH"],
        intent: "Tests comparison of computed/derived metric (density) across all provinces to find maximum."
    })

    // 2 - OCENA: Świetne - wymaga obliczeń density
    province = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which province is the least densely populated?`,
        hint: `The least densely populated province is ${province.name}`,
        rawData: province.name,
        type: ["AGGREGATION_AND_MATH"],
        intent: "Tests comparison of computed/derived metric (density) across all provinces to find minimum."
    })

    // 3 - OCENA: Bardzo dobre - wymaga agregacji density z prowincji
    let country = dataset
        .sort((a, b) => a.density - b.density)
        .reverse()[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is the most densely populated?`,
        hint: `The most densely populated country is ${country.name}`,
        rawData: country.name,
        type: ["AGGREGATION_AND_MATH"],
        intent: "Tests country-level density comparison, which may require aggregating province-level data."
    })

    return quizEntries;
}


function buildImpossiblesQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1 - OCENA: Świetne - ranking wymaga pełnej pamięci
    let provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.population - b.population)
        .reverse()
        .slice(0, 5)

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List TOP 5 provinces with the greatest population.`,
        hint: `${dsUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name),
        type: ["TOP_K_RANKING", "AGGREGATION_AND_MATH", "IMPOSSIBLE"],
        intent: "Tests ability to rank all provinces by population and recall the exact top 5 in order."
    })

    // 2 - OCENA: Świetne - ranking z obliczeniami
    provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .reverse()
        .slice(0, 5)

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List TOP 5 provinces with the highest population density.`,
        hint: `${dsUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name),
        type: ["TOP_K_RANKING", "AGGREGATION_AND_MATH", "IMPOSSIBLE"],
        intent: "Tests ranking provinces by computed metric (density) and recalling exact top 5."
    })

    // 3 - OCENA: Świetne - odwrotny ranking
    provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .slice(0, 5)

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List TOP 5 provinces with the lowest population density.`,
        hint: `${dsUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name),
        type: ["TOP_K_RANKING", "AGGREGATION_AND_MATH", "IMPOSSIBLE"],
        intent: "Tests ranking provinces by computed metric in reverse order (lowest density) and recalling exact bottom 5."
    })

    // 4 - OCENA: ŚWIETNE - super trudne, wymaga sumowania wszystkich zasobów
    let country = dsUtils.pickOne(dataset);
    let totalResourceProductionInKg = country.province
        .map(p => p.resources.map(r => r.normalisedProductionInKg)
            .reduce((prev, curr) => prev + curr, 0))
        .reduce((prev, curr) => prev + curr, 0)
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `What is the total resource production of ${country.name}? Sum everything up and give a single total number with an unit.`,
        hint: `FACT: The total resource production of the country "${country.name}" is ${totalResourceProductionInKg} kilograms.`,
        rawData: totalResourceProductionInKg,
        type: ["IMPOSSIBLE", "AGGREGATION_AND_MATH", "MULTI_HOP_REASONING"],
        intent: "Tests deep aggregation: sum all resource production across all provinces and resources, requiring extensive computation."
    })

    // 5 - OCENA: Dobre - odwrotność pytania z tricky
    country = dataset
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is the least densely populated?`,
        hint: `The least densely populated country is ${country.name}`,
        rawData: country.name,
        type: ["IMPOSSIBLE", "AGGREGATION_AND_MATH"],
        intent: "Tests country-level density comparison (minimum), potentially requiring province-level aggregation."
    })

    return quizEntries;
}