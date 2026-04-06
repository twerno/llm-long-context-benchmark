/**
 * Represents the schema for a fantasy country.
 */
export interface ICountrySchema {
    name: string,
    flagColors: string[],
    stateSystem: string,
    population: number,
    province: IProvince[],
    area: number,
    ruler: string
}

/**
 * Represents a province within a country.
 */
export interface IProvince {
    name: string,
    population: number,
    area: number,
    resources: IResource[],
    cities: ICity[],
    fauna: string[],
    flora: string[],
    crimeRates: ICrimeRate[],
    climate: string
}

/**
 * Represents a resource produced in a province.
 */
export interface IResource {
    type: string,
    resourceClass: "basic" | "industry" | "high_tech" | 'magical',
    productionRate: number
}

/**
 * Represents a city within a province.
 */
export interface ICity {
    name: string,
    population: number,
    capital: boolean
}

/**
 * Represents the crime rate for a specific type of crime.
 */
export interface ICrimeRate {
    type: string,
    rate: number
}