import { argv, stderr, stdout } from "node:process";
import { finish, start } from "./wlproc.js";

const proc = start(argv[2] || "", argv.slice(3), (stream, data) => {
	if (stream === "stderr") {
		stderr.write(data);
	} else if (stream === "stdout") {
		stdout.write(data);
	}
});

process.on("SIGINT", () => {
	proc.child.kill("SIGINT");
});

process.on("SIGTERM", () => {
	proc.child.kill("SIGTERM");
});

const result = await finish(proc);

console.log(
	`child process exited with code ${result.code}, ${result.signal}, duration: ${result.duration / 1000000n}.${result.duration % 1000000n}ms`,
);

if (result.code) {
	process.exit(result.code);
}

process.exit(1);
