import { parentPort, workerData } from "node:worker_threads";
import { dbInit } from "./db.js";

const batchSize = workerData.batchSize;
const [log, close] = await dbInit(batchSize);

const queue = [];

parentPort.on("message", async ([type, msg]) => {
	if (type === "log") {
		queue.push(async () => await log(msg));
		doWork();
	}

	if (type === "close") {
		queue.push(async () => {
			await close();
			parentPort.postMessage("closed");
		});
		doWork();
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
