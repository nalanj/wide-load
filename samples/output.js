import { setTimeout } from "node:timers/promises";

const iterations = 1000;

for (let i = 0; i < iterations; i++) {
	console.log(`testing ${i}`);
	await setTimeout(5);
}

process.exit(1);
