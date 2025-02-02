import type { Writable } from "node:stream";

type LogMessageValueNonEmpty = string | number | bigint | Date | boolean;
type LogMessageValue = LogMessageValueNonEmpty | null | undefined;

type LogMessage = {
	[key: string]: LogMessageValue;
};

export function log(
	logMsg: LogMessage,
	stream: Writable = process.stdout,
): void {
	stream.write(`${logLine(logMsg)}\n`);
}

export function logLine(logMsg: LogMessage): string {
	return Object.entries(logMsg)
		.filter((entry) => entry[1] !== undefined && entry[1] !== null)
		.map(([key, value]) => logAttr(key, value))
		.join(" ");
}

export function logAttr(key: keyof LogMessage, value: LogMessageValue): string {
	if (value === null || value === undefined) {
		return "";
	}

	let stringValue: string;
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
		} else if (stringValue[i] === "\r") {
			out += "\\r";
		} else if (stringValue[i] === "\t") {
			out += "\\t";
		} else if (stringValue[i] === " ") {
			needsQuotes = true;
			out += stringValue[i];
		} else {
			out += stringValue[i];
		}
	}

	return `${key}=${needsQuotes ? '"' : ""}${out}${needsQuotes ? '"' : ""}`;
}
