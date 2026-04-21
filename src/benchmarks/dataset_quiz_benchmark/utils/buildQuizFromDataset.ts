import { IQuizEntry as IQuizQuestion } from "./IQuizTypes";
import { ICountrySchema } from "../dataset_generator/FantasyCountryDatasetTypes";
import { default as dsUtils } from "./DatasetUtils";

/**
 * Builds a quiz from the provided fantasy country dataset.
 */
export default function buildQuizFromDataset(dataset: ICountrySchema[], setIdx: number): IQuizQuestion[] {
    let idx = 0;
    const questionIdxGenerator = () => idx++;

    return [
        ...buildNewQuestions(dataset, questionIdxGenerator, setIdx)
    ];
}

function buildNewQuestions(dataset: ICountrySchema[], questionIdxGenerator: () => number, setIdx: number): IQuizQuestion[] {
    const quizEntries: IQuizQuestion[] = [];

    // 1. nazwa władcy po countryname
    let country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Who is the ruler of ${country.name}?`,
        hint: `FACT: The ruler of ${country.name} is ${country.ruler}.`,
        rawData: country.ruler,
        type: ["FACT_RETRIEVAL", "SCALAR_OUTPUT"]
    });

    // 2. wymień colory flagi po nazwie władcy
    country = dsUtils.pickOne(dataset);
    let flagColors = dsUtils.joinList(country.flagColors)
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the colors of the flag of the country ruled by ${country.ruler}?`,
        hint: `FACT: The ruler ${country.ruler} rules ${country.name}, which has flag colors: ${flagColors}.`,
        rawData: country.flagColors,
        type: ["RELATIONAL_MAPPING", "LIST_OUTPUT"]
    });

    // 3. podaj nazwę państwa i ustrój po nazwie władcy
    country = dsUtils.pickOne(dataset);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the name and state system of the country ruled by ${country.ruler}?`,
        hint: `FACT: The ruler ${country.ruler} rules ${country.name}, which has a ${country.stateSystem} system.`,
        rawData: `${country.name} (${country.stateSystem})`,
        type: ["MULTI_HOP_REASONING", "MULTIPLE_FACTS", "SCALAR_OUTPUT"]
    });

    // 4. czy władcą countryname jest ruler
    country = dsUtils.pickOne(dataset);
    let someRuler: string = "";
    if (dataset.length === 1) {
        someRuler = dsUtils.pickOne([country.ruler, "Dlonra Reggenewzrahcs The Great"]);
    } else {
        const country2 = dsUtils.pickOneBut(dataset, country)
        someRuler = dsUtils.pickOne([country.ruler, country2.ruler]);
    }
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Is ${someRuler} the ruler of ${country.name}? Answer with 'Yes' or 'No'.`,
        hint: country.ruler === someRuler
            ? `FACT: Yes, ${someRuler} is indeed the ruler of ${country.name}.`
            : `FACT: No, the ruler of ${country.name} is actually ${country.ruler}.`,
        rawData: country.ruler === someRuler,
        type: ["LOGICAL_FILTERING", "BOOLEAN_OUTPUT"]
    });

    // 5. czy władca wlada panstwem, który ma x kolorów flagi (false)
    country = dsUtils.pickOne(dataset);
    let wrongColorCount = country.flagColors.length + 1;
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Does the ruler ${country.ruler} rule a country that has ${wrongColorCount} flag colors? Answer with 'Yes' or 'No'.`,
        hint: `FACT: The ruler ${country.ruler} rules ${country.name}, which has ${country.flagColors.length} flag colors.`,
        rawData: false,
        type: ["LOGICAL_FILTERING", "BOOLEAN_OUTPUT"]
    });

    // 6. czy władca wlada panstwem, który ma x kolorów flagi (true)
    country = dsUtils.pickOne(dataset);
    let correctColorCount = country.flagColors.length;
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Does the ruler ${country.ruler} rule a country that has ${correctColorCount} flag colors? Answer with 'Yes' or 'No'.`,
        hint: `FACT: Yes, the ruler ${country.ruler} rules ${country.name}, which has exactly ${correctColorCount} flag colors.`,
        rawData: true,
        type: ["LOGICAL_FILTERING", "BOOLEAN_OUTPUT"]
    });

    // 7. do którego państwa należy prowincja
    country = dsUtils.pickOne(dataset);
    let province = dsUtils.pickOne(country.province);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `To which country does the province ${province.name} belong?`,
        hint: `FACT: The province ${province.name} is part of ${country.name}.`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING", "SCALAR_OUTPUT"]
    });

    // 8. kto jest władcą państwa, w kórym znajduje się miasto x
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let city = dsUtils.pickOne(province.cities);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Who is the ruler of the country where the city ${city.name} is located?`,
        hint: `FACT: The city ${city.name} is in ${province.name}, which is in ${country.name}, ruled by ${country.ruler}.`,
        rawData: country.ruler,
        type: ["MULTI_HOP_REASONING", "SCALAR_OUTPUT"]
    });

    // 9. lista miast z prowincji
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let cityNames = dsUtils.joinList(province.cities.map(c => c.name))
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `List the cities in the province of ${province.name}.`,
        hint: `FACT: The cities in ${province.name} are: ${cityNames}.`,
        rawData: province.cities.map(c => c.name),
        type: ["FACT_RETRIEVAL", "LIST_OUTPUT"]
    });

    // 10. największa prowincja w państwie
    country = dsUtils.pickOne(dataset);
    let largestProvince = country.province.sort((a, b) => b.area - a.area)[0];
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the largest province in ${country.name}?`,
        hint: `FACT: The largest province in ${country.name} is ${largestProvince.name}.`,
        rawData: largestProvince.name,
        type: ["COMPARISON", "SCALAR_OUTPUT"]
    });

    // 11. najmniejsza prowincja w państwie
    country = dsUtils.pickOne(dataset);
    let smallestProvince = country.province.sort((a, b) => a.area - b.area)[0];
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the smallest province in ${country.name}?`,
        hint: `FACT: The smallest province in ${country.name} is ${smallestProvince.name}.`,
        rawData: smallestProvince.name,
        type: ["COMPARISON", "SCALAR_OUTPUT"]
    });

    // 12. zasoby z prowincji - lista nazw
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let resourceNames = dsUtils.joinList(province.resources.map(r => r.type))
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the resources produced in the province of ${province.name}?`,
        hint: `FACT: The province ${province.name} produces: ${resourceNames}.`,
        rawData: province.resources.map(r => r.type),
        type: ["FACT_RETRIEVAL", "LIST_OUTPUT"]
    });

    // 13. czy prowincja produkuje dany zasob false
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let nonExistentResource = "Unobtainium";
    resourceNames = dsUtils.joinList(province.resources.map(r => r.type))
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Does the province ${province.name} produce ${nonExistentResource}? Answer with 'Yes' or 'No'.`,
        hint: `FACT: The resources in ${province.name} are ${resourceNames}. It does not produce ${nonExistentResource}.`,
        rawData: false,
        type: ["LOGICAL_FILTERING", "BOOLEAN_OUTPUT"]
    });

    // 14. czy prowincja produkuje dany zasow true
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let existingResource = dsUtils.pickOne(province.resources);

    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Does the province ${province.name} produce ${existingResource.type}? Answer with 'Yes' or 'No'.`,
        hint: `FACT: Yes, ${province.name} produces ${existingResource.type}.`,
        rawData: true,
        type: ["LOGICAL_FILTERING", "BOOLEAN_OUTPUT"]
    });

    // 15. wymien państwo, do którego należy miasto
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    city = dsUtils.pickOne(province.cities);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Which country does the city ${city.name} belong to?`,
        hint: `FACT: The city ${city.name} is located in ${country.name}.`,
        rawData: country.name,
        type: ["RELATIONAL_MAPPING", "SCALAR_OUTPUT"]
    });

    // 16. 3 najczesciej wystepujace przestepstwa w prowincji; wartosci crimeRates sa unikatowe w prowincji 
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let top3Crimes = province.crimeRates.sort((a, b) => b.rate - a.rate).slice(0, 3);
    let top3CrimeNames = dsUtils.joinList(top3Crimes.map(c => c.type))
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the 3 most frequent crimes in the province of ${province.name}?`,
        hint: `FACT: The most frequent crimes in ${province.name} are ${top3CrimeNames}.`,
        rawData: top3CrimeNames,
        type: ["COMPARISON", "SORTED_LIST", "LIST_OUTPUT"]
    });

    // 17. 3 najrzadsze przestepstwa w prowincji; wartosci crimeRates sa unikatowe w prowincji 
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let bottom3Crimes = province.crimeRates.sort((a, b) => a.rate - b.rate).slice(0, 3);
    let bottom3CrimeNames = dsUtils.joinList(bottom3Crimes.map(c => c.type))
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What are the 3 rarest crimes in the province of ${province.name}?`,
        hint: `FACT: The rarest crimes in ${province.name} are ${bottom3CrimeNames}.`,
        rawData: bottom3CrimeNames,
        type: ["COMPARISON", "SORTED_LIST", "LIST_OUTPUT"]
    });

    // 18. wysumuj wagę wszystkich zasobów produkowanych przez prowincję (w kg)
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let totalWeight = province.resources.reduce((sum, r) => sum + r.normalisedProductionInKg, 0);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `What is the total weight of all resources produced by the province of ${province.name} in kg?`,
        hint: `FACT: The total production weight for ${province.name} is ${totalWeight} kg.`,
        rawData: totalWeight,
        type: ["AGGREGATION", "SCALAR_OUTPUT", "UNIT_CONVERSION"]
    });

    // 19. daj po jednym przykładzie fauny i flory z prowincji
    country = dsUtils.pickOne(dataset);
    province = dsUtils.pickOne(country.province);
    let faunaNames = dsUtils.joinList(province.fauna);
    let floraNames = dsUtils.joinList(province.flora);
    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `Give one example of fauna and one example of flora found in ${province.name}.`,
        hint: `FACT: In ${province.name}, you can find ${faunaNames} (fauna) and ${floraNames} (flora).`,
        rawData: `${faunaNames}, ${floraNames}`,
        type: ["MULTIPLE_FACTS", "SCALAR_OUTPUT"]
    });

    // 20. wymien wszystkie stolice prowincji z panstwa
    country = dsUtils.pickOne(dataset);
    let provinceCapitals = country.province
        .map(p => p.cities.find(c => c.capital)?.name)
        .filter((c): c is string => !!c)
        .reduce((prev, curr) => ([...prev, curr]), [] as string[]);
    cityNames = dsUtils.joinList(provinceCapitals)

    quizEntries.push({
        questionInSetIdx: questionIdxGenerator(),
        questionSetIdx: setIdx,
        question: `List all the provincial capitals in ${country.name}.`,
        hint: `FACT: The capitals of the provinces in ${country.name} are: ${cityNames}.`,
        rawData: provinceCapitals,
        type: ["FACT_RETRIEVAL", "LIST_OUTPUT", "LOGICAL_FILTERING"]
    });

    return quizEntries;
}
