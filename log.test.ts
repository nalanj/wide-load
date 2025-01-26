import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { logAttr } from "./log.js";

describe("logAttr", () => {
	it("should quote whitespace", () => {
		assert.equal(logAttr("key", "val ue"), 'key="val ue"');
	});

	it("should escape quotes", () => {
		assert.equal(logAttr("key", 'val"ue'), 'key=val\\"ue');
	});

	it("should escape newlines", () => {
		assert.equal(logAttr("key", "val\nue"), "key=val\\nue");
	});

	it("should escape tabs", () => {
		assert.equal(logAttr("key", "val\tue"), "key=val\\tue");
	});

	it("should escape carriage returns", () => {
		assert.equal(logAttr("key", "val\rue"), "key=val\\rue");
	});
});
