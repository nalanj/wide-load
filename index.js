import { AsyncLocalStorage } from "node:async_hooks";

// Initialize the service for generating events
export function WideLoad(args) {
	const asyncLocalStorage = new AsyncLocalStorage();
	const svc = args.serviceName;
	const callback = args.callback || defaultCallback;

	return {
		event: (fn) => {
			return asyncLocalStorage.run({ ts: undefined, svc: undefined }, () => {
				const result = fn();

				const logMsg = asyncLocalStorage.getStore();
				logMsg.ts = new Date();
				logMsg.svc = svc;

				callback(logMsg);
				return result;
			});
		},

		get currentMessage() {
			return asyncLocalStorage.getStore();
		},
	};
}

function defaultCallback(logMsg) {
	log(logMsg);
}

function log(logMsg, stream = process.stdout) {
	stream.write(`${logLine(logMsg)}\n`);
}

function logLine(logMsg) {
	return Object.entries(logMsg)
		.map(([key, value]) => logAttr(key, value))
		.join(" ");
}

function logAttr(key, value) {
	let stringValue = JSON.stringify(value);
	if (value instanceof Date) {
		stringValue = value.toISOString();
	} else {
		stringValue = value.toString();
	}

	let out = "";
	let needsQuotes = false;
	for (let i = 0; i < stringValue.length; i++) {
		if (stringValue[i] === '"') {
			out += '\\"';
		} else if (stringValue[i] === "\n") {
			out += "\\n";
		} else if (stringValue[i] === "\r" || stringValue[i] === "\t") {
		} else if (stringValue[i] === " ") {
			needsQuotes = true;
		} else {
			out += stringValue[i];
		}
	}

	return `${key}=${needsQuotes ? '"' : ""}${out}${needsQuotes ? '"' : ""}`;
}
