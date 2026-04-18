import { ConfigLoader } from "./app/ConfigLoader"
import { BenchmarkOrchestrator } from "./benchmark_orchestrator/BenchmarkOrchestrator"
import { example } from "./config_example"

async function run() {
    const configPath = `./config.json`
    const config = ConfigLoader.load(example)
    const orchestrator = new BenchmarkOrchestrator({ config })
    await orchestrator.run()
}

run()