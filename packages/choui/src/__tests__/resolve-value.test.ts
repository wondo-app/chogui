import { describe, expect, it } from "vitest";

import { resolveValue, resolveValues } from "../markup/resolve-value";

describe("resolveValue", () => {
	it("resolves a numeric literal", () => {
		expect(resolveValue("4", undefined)).toBe(4);
		expect(resolveValue("-2", undefined)).toBe(-2);
	});

	it("resolves a {var} reference from observed state", () => {
		expect(resolveValue("{check}", { check: 18 })).toBe(18);
		expect(resolveValue("{n}", { n: "7" })).toBe(7); // numeric string coerced
	});

	it("falls back to 0 for unresolved / invalid input", () => {
		expect(resolveValue("{missing}", {})).toBe(0);
		expect(resolveValue(undefined, undefined)).toBe(0);
		expect(resolveValue("nonsense", undefined)).toBe(0);
	});
});

describe("resolveValues (comma-list, per-die for [dice])", () => {
	it("resolves a list of literals", () => {
		expect(resolveValues("3,5", undefined)).toEqual([3, 5]);
	});

	it("resolves a list of {var} refs from observed state", () => {
		expect(resolveValues("{a},{b}", { a: 3, b: 5 })).toEqual([3, 5]);
	});

	it("trims whitespace and drops blank entries", () => {
		expect(resolveValues(" 3 , 5 ", undefined)).toEqual([3, 5]);
		expect(resolveValues("3,,5", undefined)).toEqual([3, 5]);
	});

	it("returns a single-element array for one value", () => {
		expect(resolveValues("{check}", { check: 18 })).toEqual([18]);
	});

	it("returns an empty array for empty / missing input", () => {
		expect(resolveValues("", undefined)).toEqual([]);
		expect(resolveValues(undefined, undefined)).toEqual([]);
	});
});
