import type { ICity, ICountrySchema, ICrimeRate, IProvince, IResource } from "./FantasyCountryDatasetTypes";
import datasetConsts from './FantasyCountryDatasetConsts'
import dsUtils from "../DatasetUtils"

export default class FantasyCountryDatasetGenerator {

    private rb = new UniqueResourceGenerator();


    public async generateCountry(): Promise<ICountrySchema> {
        const provinces = dsUtils.buildSome({ min: 4, max: 4 })
            .builder(this.generateProvince)

        const population = provinces.map(r => r.population).reduce((prev, curr) => prev + curr, 0)
        const area = provinces.map(r => r.area).reduce((prev, curr) => prev + curr, 0)

        return {
            name: this.rb.generateUniqueCountryName(),
            flagColors: dsUtils.pickSome({ min: 2, max: 5 }).from(datasetConsts.flagColors),
            population,
            stateSystem: dsUtils.pickOne(datasetConsts.stateSystems),
            province: provinces,
            area,
            ruler: this.rb.generateUniquePersonName()
        }
    }


    private generateProvince(): IProvince {
        return {
            name: this.rb.generateUniqueProvinceName(),
            population: dsUtils.randomFrom1(100000),
            area: dsUtils.randomFrom1(100000),
            cities: dsUtils.buildSome({ min: 1, max: 5 }).builder(this.generateCity),
            climate: dsUtils.pickOne(datasetConsts.climeteTypes),
            fauna: dsUtils.pickSome({ min: 1, max: 10 }).from(datasetConsts.faunaList),
            flora: dsUtils.pickSome({ min: 1, max: 10 }).from(datasetConsts.floraList),
            resources: generateResourceProduction(),
            crimeRates: generateCrimeRates()
        }
    }


    private generateCity(idx: number): ICity {
        return {
            population: dsUtils.randomFrom1(10000),
            capital: idx === 0,
            name: this.rb.generateUniqueCityName()
        }
    }
}

function generateResourceProduction() {
    return [

        ...dsUtils.pickSome({ min: 2, max: 5 })
            .from(datasetConsts.resourcesClass0)
            .map<IResource>(type => ({
                type,
                resourceClass: "basic",
                productionRate: dsUtils.randomFrom1(1000)
            })),

        ...dsUtils.pickSome({ min: 1, max: 3 })
            .from(datasetConsts.resourcesClass1)
            .map<IResource>(type => ({
                type,
                resourceClass: "industry",
                productionRate: dsUtils.randomFrom1(100)
            })),

        ...dsUtils.pickSome({ min: 1, max: 2 })
            .from(datasetConsts.resourcesClass2)
            .map<IResource>(type => ({
                type,
                resourceClass: "high_tech",
                productionRate: dsUtils.randomFrom1(50)
            })),

        ...dsUtils.pickSome({ min: 1, max: 2 })
            .from(datasetConsts.resourcesClass3)
            .map<IResource>(type => ({
                type,
                resourceClass: "magical",
                productionRate: dsUtils.randomFrom1(30)
            }))
    ]
}

function generateCrimeRates() {
    return datasetConsts.crimeTypes
        .map<ICrimeRate>(type => ({
            type,
            rate: dsUtils.randomInt(0, 30)
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