import assert from "node:assert";
import { describe, it, mock } from "node:test";
import { WideLoad } from "./index.js";

function syncCall(wl) {
	wl.currentMessage.payload = "a payload";

	return "syncCall";
}

async function asyncCall(wl) {
	wl.currentMessage.payload = "a payload";

	return "asyncCall";
}

describe("WideLoad", () => {
	it("should build up a log context in a synchronous call", () => {
		const cb = mock.fn();

		const wl = WideLoad({
			serviceName: "testService1",
			callback: cb,
		});

		const out = wl.event(() => syncCall(wl));

		assert.equal(out, "syncCall");
		assert.equal(cb.mock.calls.length, 1);
		assert.equal(cb.mock.calls[0].arguments[0].serviceName, "testService1");
		assert.equal(cb.mock.calls[0].arguments[0].payload, "a payload");
	});

	it("should build up a log context in an asynchronous call", async () => {
		const cb = mock.fn();

		const wl = WideLoad({
			serviceName: "testService2",
			callback: cb,
		});

		const out = await wl.event(async () => await asyncCall(wl));

		assert.equal(out, "asyncCall");
		assert.equal(cb.mock.calls.length, 1);
		assert.equal(cb.mock.calls[0].arguments[0].serviceName, "testService2");
		assert.equal(cb.mock.calls[0].arguments[0].payload, "a payload");
	});
});
