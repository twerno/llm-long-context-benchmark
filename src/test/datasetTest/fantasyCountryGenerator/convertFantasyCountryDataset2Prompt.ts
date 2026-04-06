import type { ICountrySchema, IProvince } from "./datasetGenerator/FantasyCountryDatasetTypes";


/**
 * Converts a fantasy country schema into a formatted string prompt suitable for LLM input.
 * 
 * @param country - The country schema to convert.
 * @returns A formatted string representing the country's information.
 */
export default function convertFantasyCountryDataset2Prompt(country: ICountrySchema): string {
    const result = [
        `# The country name is **"${country.name}"**.`,
        `It's state system is a ${country.stateSystem} and is ruled by ${country.ruler}.`,
        `The flag of "${country.name}" has ${country.flagColors.length} colors: ${country.flagColors.join(", ")}.`,
        `It's area is divided into ${country.province.length} provinces: ${country.province.map(p => p.name).join(", ")}.`,
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
    const resourceClasses: { className: "basic" | "industry" | "high_tech" | "magical"; label: string; unit: string }[] = [
        { className: "basic", label: "basic resources", unit: "tons" },
        { className: "industry", label: "industry resources", unit: "tons" },
        { className: "high_tech", label: "high tech materials", unit: "tons" },
        { className: "magical", label: "magical components", unit: "kilograms" }
    ];
    for (const { className, label, unit } of resourceClasses) {
        const resources = province.resources.filter(v => v.resourceClass === className);
        if (resources.length > 0) {
            const resString = resources.map(v => `${v.type} - ${v.productionRate} ${unit}`).join(", ");
            result.push(`It produces ${label} like: ${resString}.`);
        }
    }

    result.push(`The most important representatives of fauna are ${province.fauna.join(", ")}, and flora ${province.flora.join(", ")}.`);
    result.push(`All of the representatives of fauna and flora are well suited to survive in a ${province.climate} climate.`);
    if (province.crimeRates.length > 0) {
        const crimeString = province.crimeRates.map(c => `${c.type} - ${c.rate} cases`).join(", ");
        result.push(`The province of ${province.name} also has its darker side, the crime rates per 1000 citizens are as follows: ${crimeString}.`);
    }

    if (province.cities.length > 0) {
        const citiesString = province.cities.map(c => `${c.name} with population of ${c.population}`).join(", ");
        result.push(`There are ${province.cities.length} main cities in that province: ${citiesString}.`);
    }

    return result.join("\n");
}