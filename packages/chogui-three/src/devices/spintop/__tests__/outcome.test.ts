import { describe, expect, it } from "vitest";

import { resolveSegmentIndex } from "../outcome";

describe("resolveSegmentIndex", () => {
  it("clamps to a valid index", () => {
    expect(resolveSegmentIndex(0, 4)).toBe(0);
    expect(resolveSegmentIndex(2, 4)).toBe(2);
    expect(resolveSegmentIndex(9, 4)).toBe(3);
    expect(resolveSegmentIndex(-1, 4)).toBe(0);
  });

  it("rounds and guards bad input", () => {
    expect(resolveSegmentIndex(1.4, 4)).toBe(1);
    expect(resolveSegmentIndex(NaN, 4)).toBe(0);
    expect(resolveSegmentIndex(0, 0)).toBe(0);
  });
});
