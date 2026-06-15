import { describe, expect, it } from "vitest";

import { cellPositions, defaultLayout } from "../layout";

describe("defaultLayout", () => {
  it("always returns ring", () => {
    expect(defaultLayout(2)).toBe("ring");
    expect(defaultLayout(4)).toBe("ring");
    expect(defaultLayout(8)).toBe("ring");
  });
});

describe("cellPositions", () => {
  it("track is a straight row spanning the diameter", () => {
    const cells = cellPositions(3, "track", 1.4);
    expect(cells.map((c) => c.z)).toEqual([0, 0, 0]);
    expect(cells[0]!.x).toBeCloseTo(-1.4);
    expect(cells[1]!.x).toBeCloseTo(0);
    expect(cells[2]!.x).toBeCloseTo(1.4);
  });

  it("half spreads cells over a semicircle", () => {
    const cells = cellPositions(3, "half", 1.4);
    expect(cells.length).toBe(3);
    // All on a circle of the given radius.
    for (const c of cells) {
      expect(Math.hypot(c.x, c.z)).toBeCloseTo(1.4, 5);
    }
    // First cell is leftmost, last is rightmost.
    expect(cells[0]!.x).toBeLessThan(cells[2]!.x);
  });

  it("grid fills 3 columns left-to-right, top-to-bottom", () => {
    const cells = cellPositions(7, "grid", 1.4);
    expect(cells.length).toBe(7);
    // First row: 3 cells, second row: 3 cells, third row: 1 cell.
    // Columns should be at x = -1.4, 0, 1.4.
    expect(cells[0]!.x).toBeCloseTo(-1.4);
    expect(cells[1]!.x).toBeCloseTo(0);
    expect(cells[2]!.x).toBeCloseTo(1.4);
    // Second row starts at the same x positions.
    expect(cells[3]!.x).toBeCloseTo(-1.4);
    // All x positions are within the radius.
    for (const c of cells) {
      expect(Math.abs(c.x)).toBeLessThanOrEqual(1.4001);
    }
  });

  it("ring spaces cells on a circle of the given radius", () => {
    const r = 1.4;
    const cells = cellPositions(8, "ring", r);
    expect(cells.length).toBe(8);
    for (const c of cells) {
      expect(Math.hypot(c.x, c.z)).toBeCloseTo(r, 5);
    }
  });

  it("never returns empty", () => {
    expect(cellPositions(0, "ring").length).toBe(1);
  });
});
