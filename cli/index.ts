import { argv, stderr, stdout } from "node:process";
import { log } from "../log.js";
import { finish, start } from "./child-proc.js";

const command = argv[2] || "";
const args = argv.slice(3);

log({
	at: new Date(),
	wl: true,
	msg: "child process start",
	command: command,
	args: args.join(" "),
});

const proc = start(command, args, (stream, data) => {
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

log({
	at: new Date(),
	wl: true,
	msg: "child process exited",
	code: result.code,
	signal: result.signal,
	duration: result.duration / 1000000n,
});

if (result.code) {
	process.exit(result.code);
}

process.exit(1);
