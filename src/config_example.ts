import { IBenchmarkConfig } from "./benchmark_orchestrator/configTypes";

const example: IBenchmarkConfig = {
    global_llms: {
        "google_gemma-4-26B-A4B-it-Q4_K_S": {
            type: "llamacpp",
            executablePath: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
            modelPath: "D:/modele AI/LM Studio/bartowski/gemma-4-26b-a4b-it-gguf/google_gemma-4-26B-A4B-it-Q4_K_S.gguf",
            extraFlags: ["--no-cache-prompt"]
        },
        "Bielik-4.5B-v3.0-Instruct.Q8_0": {
            type: "llamacpp",
            executablePath: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
            modelPath: "D:/modele AI/LM Studio/speakleash/Bielik-4.5B-v3.0-Instruct-GGUF/Bielik-4.5B-v3.0-Instruct.Q8_0.gguf",
            ctxSize: 8192,
        }
    },
    global_test_definions: {
        "quiz_size_2_2": {
            testType: "dataset_quiz",
            params: {
                datasetSetSize: 2,
                evaluationStepRuns: 2,
                questionsSetSize: 2
            }
        }
    },
    tests: [
        {
            benchmarkRunner: "Bielik-4.5B-v3.0-Instruct.Q8_0",
            evaluationRunner: "google_gemma-4-26B-A4B-it-Q4_K_S",
            runs: 3,
            test: "quiz_size_2_2",
            name: "Bielik-4.5B_quiz_size_2_2"
        }
    ]
}