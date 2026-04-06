import { ICountrySchema } from "./DatasetGeneratorTypes";
import dsUtils from "./DatasetUtils"

interface ITestQAndA {
    question: string,
    answer: string,
    rawAnswer: string | string[] | boolean
}

export function buildQuestions(dataset: ICountrySchema[]) {
    return build10SimpleQuestions(dataset);
}

function build10SimpleQuestions(dataset: ICountrySchema[]): ITestQAndA[] {
    const tests: ITestQAndA[] = [];

    // 1
    let country = dsUtils.pickOne(dataset);
    tests.push({
        question: `What is the name of the ruler of the ${country.name}?`,
        answer: `The ruler of the ${country.name} is ${country.ruler}.`,
        rawAnswer: country.ruler
    })

    // 2
    country = dsUtils.pickOne(dataset);
    tests.push({
        question: `What are the colors of the ${country.name}?`,
        answer: `The colors of the ${country.name} are ${country.flagColors.join(", ")}.`,
        rawAnswer: country.flagColors
    })

    // 3
    country = dsUtils.pickOne(dataset);
    tests.push({
        question: `What is the state system of the ${country.name}?`,
        answer: `The state system of the ${country.name} is ${country.stateSystem}.`,
        rawAnswer: country.stateSystem
    })

    // 4
    country = dsUtils.pickOne(dataset);
    tests.push({
        question: `How many provinces has the ${country.name}?`,
        answer: `There are ${country.province.length} in the ${country.name}.`,
        rawAnswer: `${country.province.length}`
    })

    // 5
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province);
    tests.push({
        question: `In which country the ${province.name} province is located?`,
        answer: `The province ${province.name} is located in ${country.name}.`,
        rawAnswer: country.name
    })

    // 6
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    tests.push({
        question: `What are the names of the resources that is produced in the ${province.name}?`,
        answer: `The province ${province.name} of ${country.name} produces ${province.resources.map(p => p.type).join(", ")}.`,
        rawAnswer: province.resources.map(p => p.type)
    })

    // 7
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    tests.push({
        question: `What are the cities of ${province.name}?`,
        answer: `The cities of ${province.name} are ${province.cities.map(c => c.name).join(", ")}.`,
        rawAnswer: province.cities.map(c => c.name)
    })

    // 8
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let province2 = dsUtils.pickOne(country.province);
    let fauna = dsUtils.pickOne(province2.fauna);
    tests.push({
        question: `Is ${fauna} lives in ${province.name}?`,
        answer: province.fauna.includes(fauna) ? `Yes, it does.` : `No, it doesn't.`,
        rawAnswer: province.fauna.includes(fauna)
    })

    // 9
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    province2 = dsUtils.pickOne(country.province);
    let flora = dsUtils.pickOne(province2.flora);
    tests.push({
        question: `Is ${flora} is growing in ${province.name}?`,
        answer: province.flora.includes(flora) ? `Yes, it does.` : `No, it doesn't.`,
        rawAnswer: province.flora.includes(flora)
    })

    // 10
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    tests.push({
        question: `What is the area of the ${province.name}?`,
        answer: `The area of the ${province.name} is ${province.area} square kilometers.`,
        rawAnswer: `${province.area}`
    })

    return tests;
}

function buildComplexQuestion() {

}

function buildTrickyQuestion() {

}