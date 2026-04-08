import type { ICity, ICountrySchema, ICrimeRate, IProvince, IResource } from "./FantasyCountryDatasetTypes";
import datasetConsts from './FantasyCountryDatasetConsts'
import dsUtils from "../DatasetUtils"

export default class FantasyCountryDatasetGenerator {

    private rb = new UniqueResourceGenerator();


    public async generateCountry(): Promise<ICountrySchema> {
        const provinces = dsUtils.buildSome({ min: 4, max: 4 })
            .builder(() => this.generateProvince())

        const population = provinces.map(r => r.population).reduce((prev, curr) => prev + curr, 0)
        const area = provinces.map(r => r.area).reduce((prev, curr) => prev + curr, 0)
        const density = Math.round(population / area * 100) / 100;

        return {
            name: this.rb.generateUniqueCountryName(),
            flagColors: dsUtils.pickSome({ min: 2, max: 5 }).from(datasetConsts.flagColors),
            population,
            stateSystem: dsUtils.pickOne(datasetConsts.stateSystems),
            province: provinces,
            area,
            density,
            ruler: this.rb.generateUniquePersonName()
        }
    }


    private generateProvince(): IProvince {
        const population = dsUtils.randomFrom1(100000);
        const area = dsUtils.randomFrom1(100000);
        const density = Math.round(population / area * 100) / 100;

        return {
            name: this.rb.generateUniqueProvinceName(),
            population,
            area,
            density,
            cities: dsUtils.buildSome({ min: 2, max: 5 }).builder(idx => this.generateCity(idx)),
            climate: dsUtils.pickOne(datasetConsts.climeteTypes),
            fauna: dsUtils.pickSome({ min: 2, max: 10 }).from(datasetConsts.faunaList),
            flora: dsUtils.pickSome({ min: 2, max: 10 }).from(datasetConsts.floraList),
            resources: generateResourceProduction(),
            crimeRates: generateCrimeRates()
        }
    }


    private generateCity(idx: number): ICity {
        return {
            capital: idx === 0,
            name: this.rb.generateUniqueCityName()
        }
    }
}

function generateResourceProduction() {
    const buildResource = (props: Pick<IResource, "type" | "resourceClass" | "unit">, rateLimit: number): IResource => {
        const productionRate = dsUtils.randomFrom1(rateLimit)
        const normalisedProductionInKg = productionRate * (props.unit === "tons" ? 1000 : 1)
        return {
            ...props,
            productionRate,
            normalisedProductionInKg
        }
    }

    return [

        ...dsUtils.pickSome({ min: 2, max: 3 })
            .from(datasetConsts.resourcesClass0)
            .map<IResource>(type => buildResource({
                type,
                resourceClass: "basic",
                unit: "tons",
            }, 1000)),

        ...dsUtils.pickSome({ min: 2, max: 3 })
            .from(datasetConsts.resourcesClass1)
            .map<IResource>(type => buildResource({
                type,
                resourceClass: "industry",
                unit: "tons",
            }, 100)),

        ...dsUtils.pickSome({ min: 2, max: 3 })
            .from(datasetConsts.resourcesClass2)
            .map<IResource>(type => buildResource({
                type,
                resourceClass: "high_tech",
                unit: "tons",
            }, 50)),

        ...dsUtils.pickSome({ min: 2, max: 3 })
            .from(datasetConsts.resourcesClass3)
            .map<IResource>(type => buildResource({
                type,
                resourceClass: "magical",
                unit: "kilograms",
            }, 30)),
    ]
}

function generateCrimeRates() {
    return datasetConsts.crimeTypes
        .map<ICrimeRate>(type => ({
            type,
            rate: dsUtils.randomInt(0, 90)
        }))
}

class UniqueResourceGenerator {

    public generateUniqueCityName() {

        const generator = () => [
            dsUtils.pickOne(datasetConsts.fantasyCities),
            dsUtils.pickOne(datasetConsts.citySuffixes)
        ]
            .join("");

        return this.generatorUniqueResourceGuard(generator, "city");
    }

    public generateUniquePersonName() {

        const generator = () => [
            dsUtils.pickOne(datasetConsts.personNames),
            dsUtils.pickOne(datasetConsts.personNames),
            dsUtils.pickOne(datasetConsts.PersonNameSuffixes)
        ]
            .join(" ")

        return this.generatorUniqueResourceGuard(generator, "person");
    }


    public generateUniqueCountryName() {

        const generator = () => [
            dsUtils.pickOne(datasetConsts.countryNamePrefixes),
            dsUtils.pickOne(datasetConsts.countryNames)
        ]
            .join("")

        return this.generatorUniqueResourceGuard(generator, "country");
    }


    public generateUniqueProvinceName() {

        const generator = () => [
            dsUtils.pickOne(datasetConsts.countryNames)
        ]
            .join("")

        return this.generatorUniqueResourceGuard(generator, "province");
    }



    private generatedResourcesCache: Record<string, Record<string, boolean>> = {}

    private generatorUniqueResourceGuard(generator: () => string, resourceName: string) {
        const resourceMap = this.generatedResourcesCache[resourceName] || {}
        this.generatedResourcesCache[resourceName] = resourceMap

        let safetyWhileTrueFuse = 100;
        while (true) {
            const resource = generator();

            if (!(resource in resourceMap)) {
                resourceMap[resource] = true
                return resource;
            }

            if (--safetyWhileTrueFuse <= 0) {
                throw new Error(`Error generating unique resource ""${resourceName}!`)
            }
        }
    }
}