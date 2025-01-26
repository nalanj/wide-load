import type { Writable } from "node:stream";
import type { ValueOf } from "type-fest";

type LogMessage = {
	[key: string]: string | number | Date | boolean;
};

export function log(
	logMsg: LogMessage,
	stream: Writable = process.stdout,
): void {
	stream.write(`${logLine(logMsg)}\n`);
}

export function logLine(logMsg: LogMessage): string {
	return Object.entries(logMsg)
		.map(([key, value]) => logAttr(key, value))
		.join(" ");
}

export function logAttr(
	key: keyof LogMessage,
	value: ValueOf<LogMessage>,
): string {
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
