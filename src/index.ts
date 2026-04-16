import { ConfigLoader } from "./app/ConfigLoader"
import { BenchmarkOrchestrator } from "./benchmark_orchestrator/BenchmarkOrchestrator"

async function run() {
    const configPath = `./config.json`
    const { tasks, globalConfigs } = ConfigLoader.load(configPath)
    const orchestrator = new BenchmarkOrchestrator({ tasks, globalConfigs })
    await orchestrator.run()
}

run()