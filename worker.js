import { parentPort } from "node:worker_threads";
import { dbInit } from "./db.js";

const [log, close] = await dbInit();

const queue = [];

parentPort.on("message", async ([type, msg]) => {
	if (type === "log") {
		queue.unshift(async () => await log(msg));
		doWork();
	}

	if (type === "close") {
		queue.unshift(async () => {
			await close();
			parentPort.postMessage("closed");
		});
	}
});

let working = false;
async function doWork() {
	if (working) {
		return;
	}

	working = true;

	while (queue.length) {
		const fn = queue.shift();
		await fn();
	}

	working = false;
}
