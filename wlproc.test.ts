import assert from "node:assert";
import { describe, it } from "node:test";
import { finish, start } from "./wlproc.ts";

describe("run", () => {
	it("runs a successful command", async () => {
		const output: { stream: string; data: string }[] = [];

		const proc = start(process.argv[0], ["--version"], (stream, data) =>
			output.push({ stream, data }),
		);
		const result = await finish(proc);

		assert.equal(result.code, 0);
		assert.equal(result.signal, null);
		assert.equal(output.length, 1);
	});

	it("runs a failing command", async () => {
		const output: { stream: string; data: string }[] = [];

		const proc = start(process.argv[0], ["./samples/fail.js"], (stream, data) =>
			output.push({ stream, data }),
		);
		const result = await finish(proc);

		assert.equal(result.code, 1);
		assert.equal(result.signal, null);
		assert.equal(output.length, 1);
		assert.equal(output[0].stream, "stderr");
	});

	it("handles a signal exit", async () => {
		const output: { stream: string; data: string }[] = [];

		const proc = start(
			process.argv[0],
			// set the heap size to a tiny 16MB to trigger a SIGABRT
			["--max-old-space-size=16", "./samples/heap.js"],
			(stream, data) => output.push({ stream, data }),
		);
		const result = await finish(proc);

		assert.equal(result.code, null);
		assert.equal(result.signal, "SIGABRT");
	});
});
