import { ICity, ICountrySchema, ICrimeRate, IDatasetConst, IProvince, IResource } from "./DatasetGeneratorTypes";
import dsUtils from "./DatasetUtils"

export async function generateCountry(): Promise<ICountrySchema> {
    const provinces = dsUtils.buildSome({ min: 4, max: 4 })
        .builder(generateProvince)

    const population = provinces.map(r => r.population).reduce((prev, curr) => prev + curr, 0)
    const area = provinces.map(r => r.area).reduce((prev, curr) => prev + curr, 0)

    return {
        name: buildCountryName(),
        flagColors: dsUtils.pickSome({ min: 2, max: 5 }).from(IDatasetConst.flagColors),
        population,
        stateSystem: dsUtils.pickOne(IDatasetConst.stateSystem),
        province: provinces,
        area,
        ruler: buildPersonName()
    }
}

function generateProvince(): IProvince {
    return {
        name: buildProvinceName(),
        population: dsUtils.randomFrom1(100000),
        area: dsUtils.randomFrom1(100000),
        cities: dsUtils.buildSome({ min: 1, max: 5 }).builder(buildCity),
        climate: dsUtils.pickOne(IDatasetConst.climeteType),
        fauna: dsUtils.pickSome({ min: 1, max: 10 }).from(IDatasetConst.fauna),
        flora: dsUtils.pickSome({ min: 1, max: 10 }).from(IDatasetConst.flora),
        resources: buildResourceProduction(),
        crimeRates: buildCrimeRates()
    }
}

function buildCity(idx: number): ICity {
    return {
        population: dsUtils.randomFrom1(10000),
        capital: idx === 0,
        name: buildCityName()
    }
}

function buildCityName() {
    return [
        dsUtils.pickOne(IDatasetConst.fantasyCities),
        dsUtils.pickOne(IDatasetConst.citySuffixes)
    ].join("")
}

function buildPersonName() {
    return [
        dsUtils.pickOne(IDatasetConst.names),
        dsUtils.pickOne(IDatasetConst.names),
        dsUtils.pickOne(IDatasetConst.nameSuffixes)
    ].join(" ")
}

function buildCountryName() {
    return [
        dsUtils.pickOne(IDatasetConst.countryNamePrefixes),
        dsUtils.pickOne(IDatasetConst.countryNames)
    ].join("")
}

function buildProvinceName() {
    return [
        dsUtils.pickOne(IDatasetConst.countryNames)
    ].join("")
}

function buildResourceProduction() {
    return [

        ...dsUtils.pickSome({ min: 2, max: 5 })
            .from(IDatasetConst.resourcesClass0)
            .map<IResource>(type => ({
                type,
                resourceClass: "basic",
                productionRate: dsUtils.randomFrom1(1000)
            })),

        ...dsUtils.pickSome({ min: 1, max: 3 })
            .from(IDatasetConst.resourcesClass1)
            .map<IResource>(type => ({
                type,
                resourceClass: "industry",
                productionRate: dsUtils.randomFrom1(100)
            })),

        ...dsUtils.pickSome({ min: 1, max: 2 })
            .from(IDatasetConst.resourcesClass2)
            .map<IResource>(type => ({
                type,
                resourceClass: "high_tech",
                productionRate: dsUtils.randomFrom1(50)
            })),

        ...dsUtils.pickSome({ min: 1, max: 2 })
            .from(IDatasetConst.resourcesClass3)
            .map<IResource>(type => ({
                type,
                resourceClass: "magical",
                productionRate: dsUtils.randomFrom1(30)
            }))
    ]
}

function buildCrimeRates() {
    return IDatasetConst.crimeType
        .map<ICrimeRate>(type => ({
            type,
            rate: dsUtils.randomInt(0, 30)
        }))
}