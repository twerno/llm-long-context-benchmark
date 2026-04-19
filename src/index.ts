import { ZArgvSchema } from "./app/argvSchema";
import { ConfigLoader } from "./app/ConfigLoader"
import { BenchmarkOrchestrator } from "./benchmark_orchestrator/BenchmarkOrchestrator"

async function run() {
    const parsedArgv = parseArgv();
    console.log(`Starting with params: ${JSON.stringify(parsedArgv, null, 2)}`)
    const configJson = ConfigLoader.readFile(parsedArgv.configFilePath ?? `./config.json`)
    const config = ConfigLoader.load(configJson)
    const orchestrator = new BenchmarkOrchestrator({ config, rootDir: parsedArgv.rootDir, testId: parsedArgv.testId })
    await orchestrator.run()
}

run()


function parseArgv() {

    const config = {
        configFilePath: extract(/--configFilePath=([^\s]+)/),
        rootDir: extract(/--rootDir=([^\s]+)/),
        testId: extract(/--testId=([^\s]+)/),
    };

    return ZArgvSchema.parse(config);
}

function extract(regExpr: RegExp) {
    const param = process.argv.find(v => regExpr.test(v));
    if (!param) {
        return undefined
    }
    const regRexprArr = regExpr.exec(param)
    if (!regRexprArr) {
        return undefined
    }
    return regRexprArr[1]
}