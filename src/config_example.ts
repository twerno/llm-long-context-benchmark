import { IConfig } from "./app/configType";


export const example: IConfig = {
    llms_config: {
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
        },
        "gemma-4-E4B-it-Q4_K_M": {
            type: "llamacpp",
            executable_path: "D:/Programy/llama-b8708-bin-win-vulkan-x64/llama-server.exe",
            model_path: "D:/modele AI/LM Studio/lmstudio-community/gemma-4-E4B-it-GGUF/gemma-4-E4B-it-Q4_K_M.gguf",
            ctx_size: 8192,
        }
    },
    benchmarks_config: {
        "quiz_size_2_2": {
            benchmark_type: "dataset_quiz",
            params: {
                datasetSetSize: 2,
                questionsSetSize: 2
            }
        }
    },
    tasks_config: [
        {
            benchmark_llm: "gemma-4-E4B-it-Q4_K_M",
            evaluation_llm: "gemma-4-E4B-it-Q4_K_M",
            benchmarks: ["quiz_size_2_2"],
            evaluation_runs: 2,
            runs: 2,
            task_name: "aaa"
        }
    ]
}