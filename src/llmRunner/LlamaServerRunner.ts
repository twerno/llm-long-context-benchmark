import { ChildProcess, spawn } from 'child_process';
import { ILlamaRunner } from '../benchmark_orchestrator/configTypes';
import type { ILLMRunnerOutput, ILLMRunnerProps, IManageableLLMRunner } from './ILLMRunner';
import { OpenAICompatibleApiLlmRunner } from './OpenAICompatibleApiLlmRunner';

export interface LlamaServerRunnerProps extends ILlamaRunner {

}

export class LlamaServerRunner implements IManageableLLMRunner {
    private serverProcess: ChildProcess | null = null;
    private host: string;
    private apiRunner: OpenAICompatibleApiLlmRunner;

    public constructor(private props: LlamaServerRunnerProps) {
        this.host = `http://${props.host ?? '127.0.0.1'}:${props.port ?? 8080}`
        this.apiRunner = new OpenAICompatibleApiLlmRunner(this.host)
    }

    public async start(): Promise<void> {
        if (this.serverProcess) {
            throw new Error('Llama server is already running.');
        }

        const args = [
            '--model', this.props.model_path,
            '--port', (this.props.port ?? 8080).toString(),
            '--host', this.props.host ?? '127.0.0.1',
            '--parallel', "1",
            '--no-kv-unified',
            ...(this.props.extra_flags ?? [])
        ];

        if (this.props.ctx_size !== undefined) {
            args.push('--ctx-size', this.props.ctx_size.toString());
        }

        console.log(`Starting llama - server with args: ${args.join(' ')} `);

        this.serverProcess = spawn(this.props.executable_path, args, { detached: false });

        this.serverProcess.on('error', (err) => {
            console.error('Failed to start llama-server:', err);
            this.serverProcess = null;
        });

        this.serverProcess.stdout?.on('data', (data) => {
            process.stdout.write(data.toString());
        });

        this.serverProcess.stderr?.on('data', (data) => {
            process.stdout.write(data.toString());
        });

        // Wait for the server to be ready (simple check, in production you'd use a more robust way)
        await this.waitForServer();
    }

    private async waitForServer(timeoutMs: number = 60000): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                const response = await fetch(`${this.host}/v1/health`);
                if (response.ok) return;

            } catch {
                // ignore
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('Llama server failed to start within timeout.');
    }

    public async stop(): Promise<void> {
        if (!this.serverProcess) return;

        return new Promise((resolve) => {
            this.serverProcess?.on('exit', () => {
                this.serverProcess = null;
                resolve();
            });
            this.serverProcess?.kill('SIGINT');
            // If SIGINT doesn't work, try SIGTERM or force kill
            setTimeout(() => {
                this.serverProcess?.kill('SIGKILL');
            }, 2000);
        });
    }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {
        return this.apiRunner.run(props);
    }
}


export class ManageableLLMRunnerWrapper implements IManageableLLMRunner {
    private apiRunner: OpenAICompatibleApiLlmRunner;

    public constructor(private host: string) {
        this.apiRunner = new OpenAICompatibleApiLlmRunner(this.host)
    }

    public start() { return Promise.resolve() }
    public stop() { return Promise.resolve() }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {
        return this.apiRunner.run(props);
    }
}