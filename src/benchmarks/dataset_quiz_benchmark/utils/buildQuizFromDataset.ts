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
    ];
}

/**
 * Generates 10 simple questions based on the provided dataset.
 */
function build10SimpleQuestions(dataset: ICountrySchema[], questionIdxGenerator: () => number, setIdx: number): IQuizQuestion[] {
    const quizEntries: IQuizQuestion[] = [];

    // 1
    let country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the full name of the ruler of the ${country.name}?`,
        hint: `FACT: The ruler of the country "${country.name}" is "${country.ruler}".`,
        rawData: country.ruler,
        type: ["FACT_RETRIEVAL"]
    })

    // 2
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the colors of the ${country.name}?`,
        hint: `FACT: The colors of the country "${country.name}" are ${country.flagColors.join(", ")}.`,
        rawData: country.flagColors,
        type: ["FACT_RETRIEVAL"]
    })

    // 3
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the state system of the ${country.name}?`,
        hint: `FACT: The state system of the country "${country.name}" is "${country.stateSystem}".`,
        rawData: country.stateSystem,
        type: ["FACT_RETRIEVAL"]
    })

    // 4
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `How many provinces has the ${country.name}?`,
        hint: `FACT: There are ${country.province.length} provinces in the country "${country.name}".`,
        rawData: `${country.province.length}`,
        type: ["FACT_RETRIEVAL", "MATH_SUM"]
    })

    // 5
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `In which country is the ${province.name} province located?`,
        hint: `FACT: The province "${province.name}" is located in the country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING"],
    })

    // 6
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the names of the resources produced in ${province.name}?`,
        hint: `FACT: The province "${province.name}" of the country "${country.name}" produces the following resources: ${province.resources.map(p => p.type).join(", ")}.`,
        rawData: province.resources.map(p => p.type),
        type: ["FACT_RETRIEVAL", "LIST_OUTPUT"],
    })

    // 7
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the cities in ${province.name}?`,
        hint: `FACT: The "${province.name}" province of the country "${country.name}" has the following cities: ${province.cities.map(c => c.name).join(", ")}.`,
        rawData: province.cities.map(c => c.name),
        type: ["FACT_RETRIEVAL", "LIST_OUTPUT"],
    })

    // 8
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is ruled by ${country.ruler}?`,
        hint: `FACT: "${country.ruler}" is the ruler of country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING"]
    })

    // 9
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let city = dsUtils.pickOne(province.cities);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `In which country is the city of ${city.name} located?`,
        hint: `FACT: The city of "${city.name}" is located in the country "${country.name}".`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING", "MULTI_HOP_REASONING"]
    })

    // 10
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the area of the ${province.name}?`,
        hint: `FACT: The area of the province "${province.name}" is ${province.area} square kilometers.`,
        rawData: `${province.area}`,
        type: ["FACT_RETRIEVAL"]
    })
    return quizEntries;
}

/**
 * Complex questions requiring aggregation, filtering, or multi-step reasoning.
 */
function buildComplexQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1
    let country = dataset.sort((a, b) => a.area - b.area).reverse()[0];
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country has the largest area?`,
        hint: `FACT: Country "${country.name}" has the largest area.`,
        rawData: country.name,
        type: ["AGGREGATION_AND_SORT"]
    })

    // 2
    country = dataset.sort((a, b) => a.area - b.area)[0];
    let cities = country.province.map(p => p.cities.map(c => c.name)).reduce((prev, curr) => [...prev, ...curr], [])
    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `List all cities of the country with the smallest area?`,
        hint: `FACT: Cities of the smallest country ("${country.name}") are ${dsUtils.joinList(cities)}.`,
        rawData: cities,
        type: ["AGGREGATION_AND_SORT", "MULTI_HOP_REASONING", "MATH_SUM"]
    })

    // 3
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
        type: ["LOGICAL_FILTERING", "MULTI_HOP_REASONING", "LIST_OUTPUT", "AGGREGATION_AND_SORT"]
    })

    // 4
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
        type: ["AGGREGATION_AND_SORT", "MULTI_HOP_REASONING", "MATH_SUM"]
    })

    // 5
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
        type: ["LOGICAL_FILTERING"]
    })

    // 6
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
        type: ["LOGICAL_FILTERING"]
    })

    return quizEntries;
}

/**
 * These questions test model's ability to perform computations on memorized data.
 */
function buildTrickyQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1
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
        type: ["AGGREGATION_AND_SORT", "MATH_DIV"]
    })

    // 2
    province = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which province is the least densely populated?`,
        hint: `The least densely populated province is ${province.name}`,
        rawData: province.name,
        type: ["AGGREGATION_AND_SORT", "MATH_DIV", "REVERSE_SORT"]
    })

    // 3
    let country = dataset
        .sort((a, b) => a.density - b.density)
        .reverse()[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is the most densely populated?`,
        hint: `The most densely populated country is ${country.name}`,
        rawData: country.name,
        type: ["AGGREGATION_AND_SORT", "MATH_DIV", "MATH_SUM"],
    })

    return quizEntries;
}


function buildImpossiblesQuestions(dataset: ICountrySchema[], questionNoGenerator: () => number, setIdx: number) {
    const quizEntries: IQuizQuestion[] = [];

    // 1
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
        type: ["TOP_K_RANKING", "AGGREGATION_AND_SORT", "IMPOSSIBLE"],
    })

    // 2
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
        type: ["TOP_K_RANKING", "AGGREGATION_AND_SORT", "IMPOSSIBLE", "MATH_DIV"]
    })

    // 3
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
        type: ["TOP_K_RANKING", "AGGREGATION_AND_SORT", "IMPOSSIBLE", "MATH_DIV", "REVERSE_SORT"]
    })

    // 4
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
        type: ["IMPOSSIBLE", "AGGREGATION_AND_SORT", "MATH_SUM", "UNIT_CONVERSION"],
    })

    // 5
    country = dataset
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        questionInSetIdx: questionNoGenerator(),
        questionSetIdx: setIdx,
        question: `Which country is the least densely populated?`,
        hint: `The least densely populated country is ${country.name}`,
        rawData: country.name,
        type: ["IMPOSSIBLE", "AGGREGATION_AND_SORT", "MATH_DIV", "MATH_SUM", "REVERSE_SORT", "MULTI_HOP_REASONING"]
    })

    return quizEntries;
}