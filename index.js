import { AsyncLocalStorage } from "node:async_hooks";
import { log } from "./log.js";

// Initialize the service for generating events
export function WideLoad(args) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const svc = args.serviceName;
	const callback = args.callback || defaultCallback;

	return {
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

		get current() {
			return asyncLocalStorage.getStore();
		},
	};
}

function defaultCallback(logMsg) {
	log(logMsg);
}
