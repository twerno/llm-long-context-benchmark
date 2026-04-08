import { IQuizEntry } from "../DatasetTypes";
import { ICountrySchema } from "./datasetGenerator/FantasyCountryDatasetTypes";
import DatasetUtils from "./DatasetUtils";
import dsUtils from "./DatasetUtils"

/**
 * Builds a quiz from the provided fantasy country dataset.
 * 
 * @param dataset - An array of country schemas to generate questions from.
 * @returns An array of quiz entries containing questions and answers.
 */
export default function buildQuiz(dataset: ICountrySchema[]) {
    return [
        ...build10SimpleQuestions(dataset),
        ...buildComplexQuestions(dataset),
        // ...buildTrickyQuestions(dataset),
        // ...buildImpossiblesQuestions(dataset)
    ];
}

/**
 * Generates 10 simple questions based on the provided dataset.
 * 
 * @param dataset - An array of country schemas to generate questions from.
 * @returns An array of quiz entries containing simple questions and answers.
 */
function build10SimpleQuestions(dataset: ICountrySchema[]): IQuizEntry[] {
    const quizEntries: IQuizEntry[] = [];
    // 1
    let country = dsUtils.pickOne(dataset);
    quizEntries.push({
        question: `What is the full name of the ruler of the ${country.name}?`,
        answer: `The ruler of the ${country.name} is ${country.ruler}.`,
        rawData: country.ruler
    })
    // 2
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        question: `What are the colors of the ${country.name}?`,
        answer: `The colors of the ${country.name} are ${country.flagColors.join(", ")}.`,
        rawData: country.flagColors
    })
    // 3
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        question: `What is the state system of the ${country.name}?`,
        answer: `The state system of the ${country.name} is ${country.stateSystem}.`,
        rawData: country.stateSystem
    })
    // 4
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        question: `How many provinces has the ${country.name}?`,
        answer: `There are ${country.province.length} in the ${country.name}.`,
        rawData: `${country.province.length}`
    })
    // 5
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province);
    quizEntries.push({
        question: `In which country the ${province.name} province is located?`,
        answer: `The province ${province.name} is located in ${country.name}.`,
        rawData: country.name
    })
    // 6
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        question: `What are the names of the resources that is produced in the ${province.name}?`,
        answer: `The province ${province.name} of ${country.name} produces ${province.resources.map(p => p.type).join(", ")}.`,
        rawData: province.resources.map(p => p.type)
    })
    // 7
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        question: `What are the cities of ${province.name}?`,
        answer: `The cities of ${province.name} are ${province.cities.map(c => c.name).join(", ")}.`,
        rawData: province.cities.map(c => c.name)
    })

    // 8
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        question: `Which country is rulled by ${country.ruler}?`,
        answer: `${country.ruler} is the ruller of ${country.name}.`,
        rawData: country.name
    })

    // 9
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let city = dsUtils.pickOne(province.cities);
    quizEntries.push({
        question: `In which country the city of ${city.name} is located?`,
        answer: `The city of ${city.name} is located in ${country.name}.`,
        rawData: country.name
    })

    // 10
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    quizEntries.push({
        question: `What is the area of the ${province.name}?`,
        answer: `The area of the ${province.name} is ${province.area} square kilometers.`,
        rawData: `${province.area}`
    })
    return quizEntries;
}

/**
 * Placeholder for building complex questions.
 */
function buildComplexQuestions(dataset: ICountrySchema[]) {
    const quizEntries: IQuizEntry[] = [];

    // 1
    let country = dataset.sort((a, b) => a.area - b.area).reverse()[0];
    quizEntries.push({
        question: `Which country has the largest area?`,
        answer: `${country.name} has the largest area.`,
        rawData: country.name
    })

    // 2
    country = dataset.sort((a, b) => a.area - b.area)[0];
    let cities = country.province.map(p => p.cities.map(c => c.name)).reduce((prev, curr) => [...prev, ...curr], [])
    quizEntries.push({
        question: `List all cities of the country with the smallest area?`,
        answer: `Cities of the smallest country are ${DatasetUtils.joinList(cities)}.`,
        rawData: cities
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
        question: `List all provinces that belongs to country with ${color} in the flag and has crimilal rate of ${criminalRate.type} less or equals than ${criminalRate.rate}.`,
        answer: `${DatasetUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name)
    })

    // 4
    let countriesAndCities = dataset
        .map(c => ({
            name: c.name,
            cities: c.province
                .map(p => p.cities)
                .reduce((prev, curr) => ([...prev, ...curr]), [])
        }))
        .sort((a, b) => a.cities.length - b.cities.length)
        .reverse()
        .filter((c, _, arr) => c.cities.length === arr[0].cities.length)

    quizEntries.push({
        question: `What country has the greatest numbers of cities?`,
        answer: countriesAndCities.length === 1
            ? `The country with greatest numbers of cities is ${countriesAndCities[0].name}`
            : `There are ${countriesAndCities.length} with the greatest numbers of cities: ${DatasetUtils.joinList(countriesAndCities.map(c => c.name))}.`,
        rawData: countriesAndCities.map(c => c.name)
    })

    // 5
    country = dsUtils.pickOne(dataset);
    let totalResourceProductionInKg = country.province
        .map(p => p.resources.map(r => r.normalisedProductionInKg)
            .reduce((prev, curr) => prev + curr, 0))
        .reduce((prev, curr) => prev + curr, 0)
    quizEntries.push({
        question: `What is the total resource production of ${country.name}? sum everytinh up and give a single total number.`,
        answer: `Total resources production of ${country.name} is ${totalResourceProductionInKg} kilograms.`,
        rawData: totalResourceProductionInKg
    })

    // 6
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let province2 = dsUtils.pickOne(country.province);
    let fauna = dsUtils.pickOne(province2.fauna);
    quizEntries.push({
        question: `Does ${fauna} live in ${province.name}? Answer with 'Yes' or 'No'.`,
        answer: province.fauna.includes(fauna)
            ? `A simple 'yes' as an answer is sufficient; Extra context to help with evaluation: "${fauna} does live in ${province.name}".`
            : `A simple 'no' as an answer is sufficient; Extra context to help with evaluation: "${fauna} doesn't live in ${province.name}".`,
        rawData: province.fauna.includes(fauna)
    })

    // 7
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    province2 = dsUtils.pickOne(country.province);
    let flora = dsUtils.pickOne(province2.flora);
    quizEntries.push({
        question: `Does ${flora} grow in ${province.name}? Answer with 'Yes' or 'No'.`,
        answer: province.flora.includes(flora)
            ? `A simple 'yes' as an answer is sufficient; Extra context to help with evaluation: "${flora} does grow in ${province.name}".`
            : `A simple 'no' as an answer is sufficient; Extra context to help with evaluation: "${flora} doesn't grow in ${province.name}".`,
        rawData: province.flora.includes(flora)
    })

    return quizEntries;
}

/**
 * Those question does not test model ability memory, but its ability to make computations
 */
function buildTrickyQuestions(dataset: ICountrySchema[]) {
    const quizEntries: IQuizEntry[] = [];

    // 1
    let province = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .reverse()[0]

    quizEntries.push({
        question: `Which province is the most densely populated?`,
        answer: `The most densely populated province is ${province.name}`,
        rawData: province.name
    })

    // 2
    province = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        question: `Which province is the least densely populated?`,
        answer: `The least densely populated province is ${province.name}`,
        rawData: province.name
    })

    // 3
    let country = dataset
        .sort((a, b) => a.density - b.density)
        .reverse()[0]

    quizEntries.push({
        question: `Which country is the most densely populated?`,
        answer: `The most densely populated province is ${country.name}`,
        rawData: country.name
    })

    // 4
    country = dataset
        .sort((a, b) => a.density - b.density)[0]

    quizEntries.push({
        question: `Which country is the least densely populated?`,
        answer: `The least densely populated province is ${country.name}`,
        rawData: country.name
    })

    return quizEntries;
}

function buildImpossiblesQuestions(dataset: ICountrySchema[]) {
    const quizEntries: IQuizEntry[] = [];

    // 1
    let provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.population - b.population)
        .reverse()
        .slice(0, 5)

    quizEntries.push({
        question: `List TOP 5 provinces with the greatest population.`,
        answer: `${DatasetUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name)
    })

    // 2
    provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .reverse()
        .slice(0, 5)

    quizEntries.push({
        question: `List TOP 5 provinces with the highest population density.`,
        answer: `${DatasetUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name)
    })

    // 3
    provinces = dataset.map(c => c.province)
        .reduce((prev, curr) => ([...prev, ...curr]), [])
        .sort((a, b) => a.density - b.density)
        .slice(0, 5)

    quizEntries.push({
        question: `List TOP 5 provinces with the lowest population density.`,
        answer: `${DatasetUtils.joinList(provinces.map(p => p.name))}.`,
        rawData: provinces.map(p => p.name)
    })

    return quizEntries;
}