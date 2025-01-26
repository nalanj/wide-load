import { spawn } from "node:child_process";
import { argv, stderr, stdout } from "node:process";

const startedAt = process.hrtime.bigint();

const cmd = argv[2];
if (!cmd) {
	console.error("Usage: wide-load <command> [args...]");
	process.exit(1);
}

const args = argv.slice(3);

const child = spawn(cmd, args);

child.stdout.on("data", (data) => {
	stdout.write(data);
});

child.stderr.on("data", (data) => {
	stderr.write(data);
});

child.on("close", (code, signal) => {
	const duration = process.hrtime.bigint() - startedAt;
	console.log(
		`child process exited with code ${code}, ${signal}, duration: ${duration / 1000000n}.${duration % 1000000n}ms`,
	);
});
