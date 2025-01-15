import { AsyncLocalStorage } from "node:async_hooks";
import { Worker } from "node:worker_threads";
import { log } from "./log.js";

// Initialize the service for generating events
export async function WideLoad(args) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const svc = args.serviceName;

	const worker = new Worker(new URL("./worker.js", import.meta.url));

	const callback = args.callback || defaultCallback(worker);

	return {
		record: (name, data = {}) => {
			const { at = new Date(), ...rest } = data;
			callback({ at, svc, name, ...rest });
		},

		event: (name, fn) => {
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
