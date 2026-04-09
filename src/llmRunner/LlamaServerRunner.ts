import { spawn, ChildProcess } from 'child_process';
import type { ILLMRunnerProps, ILLMRunnerOutput, IManageableLLMRunner } from './ILLMRunner';
import { OpenApiApiRunner, type OpenApiApiRunnerProps } from './APILLMRunner';

export interface LlamaServerRunnerProps extends OpenApiApiRunnerProps {
    executablePath: string;
    modelPath: string;
    ctxSize?: number;
    port?: number;
    host?: string;
}

export class LlamaServerRunner implements IManageableLLMRunner {
    private serverProcess: ChildProcess | null = null;
    private host: string;
    private apiRunner: OpenApiApiRunner;

    public constructor(private props: LlamaServerRunnerProps) {
        this.host = `http://${props.host ?? '127.0.0.1'}:${props.port ?? 8080}`
        this.apiRunner = new OpenApiApiRunner(this.host, this.props)
    }

    public async start(): Promise<void> {
        if (this.serverProcess) {
            throw new Error('Llama server is already running.');
        }

        const args = [
            '--model', this.props.modelPath,
            '--port', (this.props.port ?? 8080).toString(),
            '--host', this.props.host ?? '127.0.0.1',
        ];

        if (this.props.ctxSize !== undefined) {
            args.push('--ctx-size', this.props.ctxSize.toString());
        }

        console.log(`Starting llama - server with args: ${args.join(' ')} `);

        this.serverProcess = spawn(this.props.executablePath, args, { detached: true });

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
                if (this.serverProcess) {
                    this.serverProcess.kill('SIGKILL');
                }
            }, 2000);
        });
    }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {
        return this.apiRunner.run(props);
    }
}


export class ManageableLLMRunnerWrapper implements IManageableLLMRunner {
    private apiRunner: OpenApiApiRunner;

    public constructor(private host: string) {
        this.apiRunner = new OpenApiApiRunner(this.host)
    }

    public start() { return Promise.resolve() }
    public stop() { return Promise.resolve() }

    public async run(props: ILLMRunnerProps): Promise<ILLMRunnerOutput> {
        return this.apiRunner.run(props);
    }
}