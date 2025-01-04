import { AsyncLocalStorage } from "node:async_hooks";

// Initialize the service for generating events
export function WideLoad(args) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const serviceName = args.serviceName;
	const callback = args.callback;

	return {
		event: (fn) => {
			return asyncLocalStorage.run({}, () => {
				const result = fn();

				callback({ ...asyncLocalStorage.getStore(), serviceName });
				return result;
			});
		},

		get currentMessage() {
			return asyncLocalStorage.getStore();
		},
	};
}
