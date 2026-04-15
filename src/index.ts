import { BenchmarkOrchestrator } from "./benchmark_orchestrator/BenchmarkOrchestrator"
import { ConfigLoader } from "./benchmark_orchestrator/ConfigLoader"

async function run() {
    const configPath = `./config.json`
    const { tasks, globalConfigs } = ConfigLoader.load(configPath)
    const orchestrator = new BenchmarkOrchestrator({ tasks, globalConfigs })
    await orchestrator.run()
}

run()