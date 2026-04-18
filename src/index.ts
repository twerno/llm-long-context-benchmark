import { ConfigLoader } from "./app/ConfigLoader"
import { BenchmarkOrchestrator } from "./benchmark_orchestrator/BenchmarkOrchestrator"
import { example } from "./config_example"

async function run() {
    const configPath = `./config.json`
    const configJson= ConfigLoader.readFile(configPath)
    const config = ConfigLoader.load(configJson)
    const orchestrator = new BenchmarkOrchestrator({ config })
    await orchestrator.run()
}

run()