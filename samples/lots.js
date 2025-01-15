import { setTimeout } from "node:timers/promises";
import { WideLoad } from "../index.js";
const wl = await WideLoad({ serviceName: "lots" });

const events = ["lots_a", "lots_b", "lots_c", "lots_d", "lots_e"];

wl.record("start");

for (let i = 0; i < 1000000; i++) {
	if (i % 100000 === 0) {
		await setTimeout(0);
	}

	wl.record(events[Math.floor(Math.random() * events.length)], {
		at: new Date(Date.now() - Math.random() * 1000 * 604800),
		junk: Math.random(),
	});
}

await wl.close();
