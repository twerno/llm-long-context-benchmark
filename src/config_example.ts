import { IConfig } from "./benchmark_orchestrator/configTypes";

const example: IConfig = {
    global_llms: {
        "google_gemma-4-26B-A4B-it-Q4_K_S": {
            type: "llamacpp",
            executable_path: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
            model_path: "D:/modele AI/LM Studio/bartowski/gemma-4-26b-a4b-it-gguf/google_gemma-4-26B-A4B-it-Q4_K_S.gguf",
            extra_flags: ["--no-cache-prompt"]
        },
        "Bielik-4.5B-v3.0-Instruct.Q8_0": {
            type: "llamacpp",
            executable_path: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
            model_path: "D:/modele AI/LM Studio/speakleash/Bielik-4.5B-v3.0-Instruct-GGUF/Bielik-4.5B-v3.0-Instruct.Q8_0.gguf",
            ctx_size: 8192,
        }
    },
    global_test_definitions: {
        "quiz_size_2_2": {
            benchmark_type: "dataset_quiz",
            params: {
                datasetSetSize: 2,
                evaluationStepRuns: 2,
                questionsSetSize: 2
            }
        }
    },
    benchmarks: [
        {
            benchmark_llm: "Bielik-4.5B-v3.0-Instruct.Q8_0",
            evaluation_llm: "google_gemma-4-26B-A4B-it-Q4_K_S",
            runs: 3,
            test: "quiz_size_2_2",
            name: "Bielik-4.5B_quiz_size_2_2"
        }
    ]
}