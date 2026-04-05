
export const IDatasetConst = {
    flagColors: [
        "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Cyan", "Magenta", "Lime", "Teal",
        "Indigo", "Violet", "Gold", "Silver", "Lavender", "Crimson"
    ],
    regimeTypes: ["Autocracy", "Monarchy", "Oligarchy", "Theocracy", "Democracy", "Technocracy", "Plutocracy", "Meritocracy"],
    // Class 0: Basic/Biological - High volume, low value
    resourcesClass0: [
        "Wheat", "Barley", "Rye", "Corn", "Rice", "Oats", "Potatoes", "Carrots",
        "Apples", "Grapes", "Wool", "Cotton", "Linen", "Timber", "Hemp", "Flax",
        "Honey", "Salt", "Sugar", "Water", "Fish", "Beef", "Leather", "Silk", "Herbs"
    ],
    // Class 1: Industrial/Geological - Specific strata, driving industry
    resourcesClass1: [
        "Coal", "Iron", "Copper", "Tin", "Lead", "Zinc", "Silver", "Gold",
        "Aluminum", "Nickel", "Sulfur", "Sand", "Clay", "Limestone", "Granite",
        "Basalt", "Quartz", "Slate", "Oil", "Natural Gas", "Rubber", "Mercury",
        "Borax", "Graphite", "Mica"
    ],
    // Class 2: Advanced/Rare Earth - High tech, high refining requirement
    resourcesClass2: [
        "Silicon", "Lithium", "Cobalt", "Platinum", "Palladium", "Uranium",
        "Plutonium", "Titanium", "Tungsten", "Neodymium", "Cerium", "Iridium",
        "Osmium", "Rhodium", "Germanium", "Indium", "Gallium", "Selenium",
        "Tellurium", "Yttrium", "Scandium", "Zirconium", "Beryllium", "Tantalum", "Niobium"
    ],
    // Class 3: Aetheric/Fantastic - Magical, extra-dimensional, extreme value
    resourcesClass3: [
        "Mana Crystals", "Aether", "Dragon Scales", "Phoenix Feathers", "Mithril",
        "Adamantium", "Orichalcum", "Moonstone", "Sunstone", "Shadow Essence",
        "Spirit Dew", "Griffin Claw", "Unicorn Horn", "Troll Blood", "Elven Wood",
        "Necrotic Dust", "Arcane Residue", "Enchanted Sap", "Wyrmbone", "Runestone",
        "Feywild Petals", "Kraken Ink", "Basilisk Venom", "Magefire Ember", "Void Matter"
    ],
    fauna: [
        "Pyros", "Aquashell", "Leafleap", "Voltwing", "Shadowprowl", "Frostbite", "Blazewing", "Dewdrop", "Vinewhip", "Sparktail", "Emberclaw",
        "Glaciermane", "Mossyback", "Thunderpaw", "Gloommane", "Scorchtail", "Torrential", "Petalburst", "Electromane", "Nightshade", "Magmabite",
        "Rippletail", "Thornspike", "Boltstrike", "Phantomfin", "Flarefin", "Icicleclaw", "Rootbound", "Zappity", "Wraithwing", "Burnis", "Mistwing",
        "Bloomheart", "Shockwave", "Eerieeye", "Heatwave", "Deepsea", "Fernfury", "Energiz", "Darkclaw", "Cindertrot", "Tidebound", "Sporecloud",
        "Wattbite", "Umbraheart", "Ashpaw", "Glaciemont", "Brambleclaw", "Voltstrike", "Shadeburst", "Pyrewing", "Hydrofin", "Florasom", "Electrosound",
        "Nocturnis", "Igniscore", "Aquastream", "Terraroot", "Aeroflight", "Spiritwhisper", "Darkpulse", "Steelfang", "Fairydust", "Dragonbreath",
        "Iceberg", "Rockcrush", "Groundswell", "Bugbite", "Poisonsting", "Flywing", "Emberwing", "Aquaspin", "Terrabite", "Aeroshift", "Spiritclaw",
        "Darkfin", "Steelwing", "Fairysong", "Dragonscale", "Icebolt", "Rockshard", "Groundspike", "Bugswarm", "Poisondart", "Flyburst", "Emberglow",
        "Aquaflow", "Terradrift", "Aerogale", "Spiritmist", "Darksurge", "Steelcrush", "Fairypuff", "Dragonfire", "Icefang", "Rockspin", "Groundbite",
        "Bugwing", "Poisonclaw", "Flytail", "Solarflare", "Lunarshade", "Starburst", "Voidwalker", "Zenwing", "Primeclaw", "Aerobite", "Bioleaf",
        "Cyberfang", "Dracozord", "Gigamane", "Megawing", "Nanospark", "Neofin", "Omnishell", "Protobite", "Xenopulse", "Emberdrift", "Aquasurge",
        "Terrablast", "Aerostorm", "Spiritflare", "Darkwing", "Steelbolt", "Fairydash", "Dragonclaw", "Icepulse", "Rockburst", "Groundcrush", "Bugsting",
        "Poisonbite", "Flyglow", "Emberdash", "Aquaflare", "Terrawave", "Aeropulse", "Spiritdent", "Darkdrift", "Steelspin", "Fairyspark", "Icefin",
        "Rockwing", "Groundtail", "Bugclaw", "Poisonwing", "Flybolt", "Solarwing", "Lunarclaw", "Starfin", "Voidbite", "Zenpulse", "Primebolt", "Aeroshine",
        "Bioburst", "Cyberglow", "Dracoflag", "Gigapulse", "Megabite", "Nanowing", "Neosurge", "Omnidark", "Protobolt", "Xenoflare", "Aquashine",
        "Terraspark", "Aeroblaze", "Spiritwing", "Darkflare", "Steelsurge", "Fairydrift", "Dragonburst", "Iceglow", "Rockpulse", "Groundshine", "Bugbolt",
        "Poisondash", "Flyspark", "Emberlight", "Aquadusk", "Terradawn", "Aerobright", "Spiritglow", "Darkshine", "Steeldrift", "Fairyburst", "Dragonwave",
        "Rockshade", "Groundflare", "Bugsurge", "Poisonglow", "Flydance", "Emberstrike", "Aquaflash", "Terracrunch", "Aeroflare", "Spiritbound"
    ],
    flora: [
        "Aetherbloom", "Shadowpetal", "Glowroot", "Frostfern", "Pyreleaf", "Duskvine", "Dawnblossom", "Mistmoss", "Stormspore", "Emberseed", "Lunarlily",
        "Solarrose", "Voidvine", "Terrathorn", "Aquapetal", "Aeroleaf", "Hydrostem", "Floraflame", "Biobud", "Cyberclover", "Magmamoss", "Glacialgrain",
        "Spiritsprout", "Darkdew", "Lightleaf", "Ironroot", "Steelstem", "Goldpetal", "Silverseed", "Bronzebranch", "Copperclover", "Zinczinnia",
        "Nickelnectar", "Cobaltclover", "Rubyrose", "Sapphiresprout", "Emeraldedge", "Diamonddew", "Opalorchid", "Pearlpoppy", "Amberash", "Jetjasmine",
        "Onyxoxalis", "Quartzquince", "Topaztulip", "Berylbud", "Peridotpetal", "Citrineclover", "Garnetgrain", "Amethystash", "Zirconzinnia", "Moonmoss",
        "Sunseed", "Starspore", "Skystem", "Seaseed", "Earthedge", "Rainroot", "Cloudclover", "Thunderthorn", "Lightningleaf", "Firefern", "Waterweed",
        "Airash", "Dustdrift", "Mudmoss", "Sandseed", "Rockrose", "Stonestem", "Pebblepetal", "Boulderbloom", "Mountainmoss", "Valleyvine", "Riverroot",
        "Lakeleaf", "Oceanorchid", "Seasprout", "Forestfern", "Junglejasmine", "Desertdew", "Tundrathorn", "Prairiepoppy", "Meadowmoss", "Gardenglow",
        "Orchardoxalis", "Grovegrain", "Bushbud", "Treethorn", "Branchbloom", "Twigtendril", "Sapseed", "Resinrose", "Barkbloom", "Leaflight",
        "Petalpulse", "Rootrevel", "Vineveil", "Sporespire", "Mossmantle", "Fernfringe", "Bloombeam", "Thornthistle", "Seedshadow", "Budburst", "Stemstrong",
        "Petalpale", "Leaflush", "Rootrough", "Vinevibrant", "Sporesoft", "Mossmighty", "Fernfine", "Bloombright", "Thornthick", "Seedsmall", "Budbig",
        "Stemsturdy", "Petalpretty", "Leaflovely", "Rootrugged", "Vinevast", "Sporesparse", "Mossmassive", "Fernfragile", "Bloombold", "Thorntough",
        "Seedstrong", "Budbrief", "Stemsteady", "Petalpink", "Leafgreen", "Rootbrown", "Vinedark", "Sporewhite", "Mossgrey", "Fernlight", "Bloomgold",
        "Thornblack", "Seedtiny", "Budsmall", "Stemlong", "Petalsoft", "Leafhard", "Rootdeep", "Vinehigh", "Sporewide", "Mossthick", "Fernthin",
        "Bloomlarge", "Thornsharp", "Seedround", "Budround", "Stemstraight", "Petalcurved", "Leafpointed", "Roottwisted", "Vineclimbing", "Sporedrifting",
        "Mosscovering", "Fernspreading", "Bloomfading", "Thornpiercing", "Seedfalling", "Budemerging", "Stemgrowing", "Petalshimmering", "Leafglistening",
        "Rootanchoring", "Vineentwining", "Sporedispersing", "Mosscarpeting", "Fernundulating", "Bloomradiating", "Thornprotecting", "Seedgerminating",
        "Budswelling", "Stemstrengthening", "Petalfluttering", "Leafrustling", "Rootpenetrating", "Vineencircling", "Sporefloating", "Mosscushioning",
        "Fernfronding", "Bloomscenting", "Thornbarbing", "Seednesting", "Budopening", "Stemtowering", "Petaldancing", "Leafswaying", "Rootburrowing",
        "Vinesnaring", "Sporeraining", "Mosslayering", "Fernshading", "Bloomglowing", "Thornstinging", "Seedplanting", "Budbursting", "Stemrising",
        "Petalfalling", "Leafdropping", "Rootspreading", "Vinecreeping", "Sporedrifting", "Mossgrowing", "Fernlush", "Bloomvibrant", "Thornfierce",
        "Seedvital", "Budfresh", "Stemrobust", "Petaldelicate", "Leafresilient", "Rootenduring", "Vinetenacious", "Sporemagical", "Mossancient",
        "Fernmystic", "Bloomethereal", "Thornshadowy", "Seedluminous", "Budradiant", "Stemmajestic", "Petalenchanting", "Leafverdant", "Rootprimordial",
        "Vineeternal", "Sporeinfinite", "Mosseverlasting", "Ferntimeless", "Bloomcelestial", "Thorninfernal", "Seedterrestrial", "Budelemental",
        "Stemmonumental", "Petalgraceful", "Leafelegant", "Rootpowerful", "Vinesupple"
    ],
    crimeType: ["theft", "burglary", "robbery", "assault", "homicide", "fraud", "drug-related crime", "cybercrime", "vandalism", "domestic violence"],
    climeteType: [
        "Pyroclasic", "Glacial", "Aetheric", "Void-vacuum", "Magmatic", "Cryogenic", "Solar-scorched", "Umbral", "Tempestuous", "Hydro-mist",
        "Arid-cinder", "Celestial", "Abyssal", "Verdant-tropical", "Permafrost", "Mana-saturated", "Chrono-flux", "Nebulous", "Tidal", "Plasma-heat"
    ]


} as const

export type TFlagColor = typeof IDatasetConst.flagColors[number]
export type TRegimeType = typeof IDatasetConst.regimeTypes[number]
export type IResourceType = typeof IDatasetConst.resourcesClass0[number]
    | typeof IDatasetConst.resourcesClass1[number]
    | typeof IDatasetConst.resourcesClass2[number]
    | typeof IDatasetConst.resourcesClass3[number]
export type IFauna = typeof IDatasetConst.fauna[number]
export type IFlora = typeof IDatasetConst.flora[number]
export type ICrimeType = typeof IDatasetConst.crimeType[number]
export type IClimateType = typeof IDatasetConst.climeteType[number]

export interface ICountrySchema {
    name: string,
    flagColors: TFlagColor[],
    regime: TRegimeType,
    population: number,
    regions: IRegion[],
    alliance: IAlliance[],
}

export interface IRegion {
    population: number,
    area: number,
    mountains: IMountain[],
    lakes: ILake[],
    resources: IResource[],
    cities: ICity[],
    fauna: IFauna[],
    flora: IFlora[],
    crimeRates: ICrimeRate[],
    climate: IClimateType
}

export interface IMountain {
    name: string,
    height: number
}

export interface ILake {
    name: string,
    area: number
}

export interface IResource {
    type: IResourceType,
    resourceClass: "basic" | "industry" | "high_tech" | 'magical',
    productionRate: number
}

export interface ICity {
    name: string,
    population: number,
    capital: boolean
}

export interface IAlliance {
    name: string,
    members: string[]
}

export interface ICrimeRate {
    type: ICrimeType,
    rate: number
}