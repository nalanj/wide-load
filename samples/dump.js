import { setTimeout } from "node:timers/promises";
import { WideLoad } from "../index.js";

const wl = WideLoad({ serviceName: "dump" });

const iterations = process.argv[2] || 1000;
const delay = process.argv[3] || 0;

console.log(`Running ${iterations} iterations with ${delay}ms delay`);

for (let i = 0; i < iterations; i++) {
	wl.event("testing", () => {
		wl.current.blah = "something\ncool";
	});

	if (delay) {
		await setTimeout(delay);
	}
}
