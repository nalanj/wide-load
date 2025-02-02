import { type ChildProcess, spawn } from "node:child_process";

type StdStream = "stdout" | "stderr";
type WLOutputFn = (stream: StdStream, data: string) => void;

type ChildProc = {
	child: ChildProcess;
	startedAt: bigint;
};

export type ChildProcResult = {
	code: number | null;
	signal: string | null;
	duration: bigint;
};

export function start(
	command: string,
	args: string[],
	onOutput: WLOutputFn,
): ChildProc {
	const startedAt = process.hrtime.bigint();
	const child = spawn(command, args, {
		stdio: ["pipe", "pipe", "pipe", "ipc"],
	});

	child.stdout?.on("data", (data: string) => {
		onOutput("stdout", data);
	});

	child.stderr?.on("data", (data: string) => {
		onOutput("stderr", data);
	});

	return { child, startedAt };
}

export async function finish(proc: ChildProc): Promise<ChildProcResult> {
	return new Promise((resolve) => {
		proc.child.on("close", (code: number, signal: string) => {
			const duration = process.hrtime.bigint() - proc.startedAt;

			resolve({ code, signal, duration });
		});
	});
}
