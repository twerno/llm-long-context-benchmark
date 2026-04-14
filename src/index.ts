import { TestOrchestratorRunner } from "./benchmark_orchestrator/TestOrchestratorRunner"
import { ConfigLoader } from "./benchmark_orchestrator/ConfigLoader"

async function run() {
    const configPath = `./config.json`
    const { tasks, globalConfigs } = ConfigLoader.load(configPath)
    const orchestrator = new TestOrchestratorRunner({ tasks, globalConfigs })
    await orchestrator.run()
}

run()