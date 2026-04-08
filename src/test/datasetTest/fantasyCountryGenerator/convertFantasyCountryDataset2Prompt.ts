import type { ICountrySchema, IFact, IProvince } from "./datasetGenerator/FantasyCountryDatasetTypes";
import DatasetUtils from "./DatasetUtils";


// alias
const joinList = DatasetUtils.joinList;


/**
 * Converts a fantasy country schema into a formatted string prompt suitable for LLM input.
 * 
 * @param country - The country schema to convert.
 * @returns A formatted string representing the country's information.
 */
export default function convertFantasyCountryDataset2Prompt(country: ICountrySchema): string {
    const result = [
        `# The country name is **"${country.name}"**.`,
        `Its state system is ${country.stateSystem} and it is ruled by ${country.ruler}.`,
        `The flag of "${country.name}" has ${country.flagColors.length} colors: ${joinList(country.flagColors)}.`,
        `Its area is divided into ${country.province.length} provinces: ${joinList(country.province.map(p => p.name))}.`,
        country.province.map(provincePrompt).join("\n")
    ];
    return result.join("\n");
}

/**
 * Generates a detailed prompt for a specific province.
 * 
 * @param province - The province schema to convert.
 * @returns A formatted string representing the province's information.
 */
function provincePrompt(province: IProvince): string {
    const result: string[] = [
        `## The province of ${province.name}`,
        `is inhabited by ${province.population} and covers an area of ${province.area} square kilometers.${province.cities.length > 0 ? ` Its capital city is ${province.cities[0].name}.` : ""}`,
    ];

    const resourceClasses: { className: "basic" | "industry" | "high_tech" | "magical"; label: string }[] = [
        { className: "basic", label: "basic resources", },
        { className: "industry", label: "industry resources", },
        { className: "high_tech", label: "high tech materials" },
        { className: "magical", label: "magical components", }
    ];
    for (const { className, label } of resourceClasses) {
        const resources = province.resources.filter(v => v.resourceClass === className);
        if (resources.length > 0) {
            const resString = joinList(resources.map(v => `${v.type} - ${v.productionRate} ${v.unit}`));
            result.push(`It produces ${label}, such as: ${resString}.`);
        }
    }

    result.push(`The most prominent members of the fauna are ${joinList(province.fauna)}, and the flora includes ${joinList(province.flora)}.`);
    result.push(`All representatives of the fauna and flora are well suited to survive in a ${province.climate} climate.`);
    if (province.crimeRates.length > 0) {
        const crimeString = joinList(province.crimeRates.map(c => `${c.type} - ${c.rate} cases`));
        result.push(`The province of ${province.name} also has its darker side; the crime rates per 1,000 citizens are as follows: ${crimeString}.`);
    }

    if (province.cities.length > 0) {
        const citiesString = joinList(province.cities.map(c => c.name));
        result.push(`There are ${province.cities.length} main cities in that province: ${citiesString}.`);
    }

    return result.join("\n");
}

export function convertfact2Prompt(fact: IFact): string {
    switch (fact.type) {
        case "mountain": return `FACT: The highest mountain across all counties is "${fact.name}" and it's ${fact.value} meters high.`
        case "lake": return `FACT: The deepest lake across all counties is "${fact.name}" and it's ${fact.value} meters deep.`
    }
}