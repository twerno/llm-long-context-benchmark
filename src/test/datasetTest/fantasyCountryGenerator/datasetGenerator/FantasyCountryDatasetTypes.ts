
export interface ICountrySchema {
    name: string,
    flagColors: string[],
    stateSystem: string,
    population: number,
    province: IProvince[],
    area: number,
    ruler: string
}

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

export interface IResource {
    type: string,
    resourceClass: "basic" | "industry" | "high_tech" | 'magical',
    productionRate: number
}

export interface ICity {
    name: string,
    population: number,
    capital: boolean
}

export interface ICrimeRate {
    type: string,
    rate: number
}