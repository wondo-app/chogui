import { describe, expect, it } from "vitest";

import {
	parseNotation,
	predeterminedNotation,
	predeterminedNotationFor,
	rollNotation,
} from "../logic/random";

describe("random source — parseNotation", () => {
	it("parses count, faces, and modifier", () => {
		expect(parseNotation("2d6+3")).toEqual({ count: 2, faces: 6, modifier: 3 });
		expect(parseNotation("d20")).toEqual({ count: 1, faces: 20, modifier: 0 });
		expect(parseNotation("3d8-1")).toEqual({ count: 3, faces: 8, modifier: -1 });
		expect(parseNotation("1d6 + 2")).toEqual({ count: 1, faces: 6, modifier: 2 });
	});

	it("rejects invalid or out-of-range notation", () => {
		expect(parseNotation("foo")).toBeNull();
		expect(parseNotation("")).toBeNull();
		expect(parseNotation(undefined)).toBeNull();
		expect(parseNotation("0d6")).toBeNull(); // count < 1
		expect(parseNotation("2d1")).toBeNull(); // faces < 2
		expect(parseNotation("200d6")).toBeNull(); // count > 100
	});
});

describe("random source — rollNotation", () => {
	it("rolls the right count, each die in range, total = sum + modifier", () => {
		for (let i = 0; i < 200; i++) {
			const r = rollNotation("2d6+3");
			expect(r).not.toBeNull();
			expect(r!.values).toHaveLength(2);
			for (const v of r!.values) {
				expect(v).toBeGreaterThanOrEqual(1);
				expect(v).toBeLessThanOrEqual(6);
			}
			expect(r!.total).toBe(r!.values[0]! + r!.values[1]! + 3);
			expect(r!.total).toBeGreaterThanOrEqual(5);
			expect(r!.total).toBeLessThanOrEqual(15);
		}
	});

	it("returns null for invalid notation", () => {
		expect(rollNotation("nonsense")).toBeNull();
	});
});

describe("random source — predeterminedNotation", () => {
	it("formats the dice-box @-notation from the rolled values (no modifier)", () => {
		const result = { spec: { count: 2, faces: 6, modifier: 3 }, values: [3, 5], total: 11 };
		expect(predeterminedNotation(result)).toBe("2d6@3,5");
	});
});

describe("visualizer — predeterminedNotationFor", () => {
	it("takes faces from notation and die count from the values", () => {
		expect(predeterminedNotationFor("d6", [4])).toBe("1d6@4");
		expect(predeterminedNotationFor("d6", [3, 5])).toBe("2d6@3,5");
		expect(predeterminedNotationFor("d20", [18])).toBe("1d20@18");
	});

	it("rounds and clamps each value into [1, faces] so a face is never impossible", () => {
		expect(predeterminedNotationFor("d6", [10])).toBe("1d6@6"); // over → faces
		expect(predeterminedNotationFor("d6", [0])).toBe("1d6@1"); // under → 1
		expect(predeterminedNotationFor("d20", [3.6])).toBe("1d20@4"); // rounded
	});

	it("returns null for invalid notation or no values", () => {
		expect(predeterminedNotationFor("nonsense", [3])).toBeNull();
		expect(predeterminedNotationFor("d6", [])).toBeNull();
		expect(predeterminedNotationFor(undefined, [3])).toBeNull();
	});
});
