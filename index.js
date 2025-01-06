import { AsyncLocalStorage } from "node:async_hooks";
import { dbInit } from "./db.js";
import { log } from "./log.js";

// Initialize the service for generating events
export async function WideLoad(args) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const svc = args.serviceName;

	const [dbEnqueue, dbClose] = await dbInit();

	const callback = args.callback || defaultCallback(dbEnqueue);

	return {
		record: (name, data) => {
			callback({ at: new Date(), svc, name, ...data });
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

		close() {
			dbClose();
		},

		get current() {
			return asyncLocalStorage.getStore();
		},
	};
}

function defaultCallback(dbEnqueue) {
	return (logMsg) => {
		dbEnqueue(logMsg);
		log(logMsg);
	};
}
