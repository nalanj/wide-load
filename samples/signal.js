import { setTimeout } from "node:timers/promises";

process.on("SIGINT", () => {
	console.error("SIGINT. Exiting.");
	process.exit(1);
});

let counter = 0;

while (true) {
	console.log(counter++);
	await setTimeout(1000);
}
