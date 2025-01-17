import { AsyncLocalStorage } from "node:async_hooks";
import { Worker } from "node:worker_threads";
import { log } from "./log.js";

// Initialize the service for generating events
export async function WideLoad({
	svc = "[unknown]",
	batchSize = 10000,
	callback,
}) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const worker = new Worker(new URL("./worker.js", import.meta.url), {
		workerData: { batchSize },
	});
	callback ||= defaultCallback(worker);

	let closed = false;

	return {
		record: (name, data = {}) => {
			if (closed) {
				throw new Error("WideLoad instance is closed");
			}

			const at = new Date();
			const { ...rest } = data;
			callback({ at, svc, name, ...rest });
		},

		event: (name, fn) => {
			if (closed) {
				throw new Error("WideLoad instance is closed");
			}

			return asyncLocalStorage.run(
				{ at: undefined, svc: undefined, name },
				() => {
					const result = fn();

					const logMsg = asyncLocalStorage.getStore();
					logMsg.at = new Date();
					logMsg.svc = svc;

					callback(logMsg);
					return result;
				},
			);
		},

		async close() {
			closed = true;
			await new Promise((resolve) => {
				worker.on("message", () => {
					resolve();
				});

				worker.postMessage(["close"]);
			});

			await worker.terminate();
		},

		get current() {
			return asyncLocalStorage.getStore();
		},
	};
}

function defaultCallback(worker) {
	return (logMsg) => {
		worker.postMessage(["log", logMsg]);
		log(logMsg);
	};
}
