import { TestOrchestratorRunner } from "./benchmark_orchestrator/TestOrchestratorRunner"

async function run() {
    const orchestrator = new TestOrchestratorRunner({ configPath: `./config.json` })
    await orchestrator.run()
}

run()