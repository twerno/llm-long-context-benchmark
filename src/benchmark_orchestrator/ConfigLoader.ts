import fs from 'fs';
import {
    IGlobalConfig,
    IInternalTestConfigWrapper,
    ZBenchmarkConfigSchema
} from './configTypes';

export interface IConfigLoaderResult {
    tasks: IInternalTestConfigWrapper[];
    globalConfigs: IGlobalConfig;
}

export class ConfigLoader {
    public static load(configPath: string): IConfigLoaderResult {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const rawConfig = ZBenchmarkConfigSchema.parse(JSON.parse(fileContent));

        const tasks: IInternalTestConfigWrapper[] = [];
        const globalConfigs: IGlobalConfig = {
            global_llms: rawConfig.global_llms,
            global_test_definitions: rawConfig.global_test_definitions
        };

        for (const entry of rawConfig.tests) {
            if (Array.isArray(entry.test)) {
                for (const testId of entry.test) {
                    tasks.push({
                        name: entry.name ? `${entry.name} - ${testId}` : testId,
                        benchmark_llm: entry.benchmark_llm,
                        evaluation_llm: entry.evaluation_llm,
                        runs: entry.runs,
                        test: testId
                    });
                }
            } else {
                tasks.push({
                    name: entry.name || entry.test,
                    benchmark_llm: entry.benchmark_llm,
                    evaluation_llm: entry.evaluation_llm,
                    runs: entry.runs,
                    test: entry.test
                });
            }
        }

        return { tasks, globalConfigs };
    }
}
