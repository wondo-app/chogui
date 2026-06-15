// Pure board-cell layout — no WebGL, unit-tested. Given a cell count and a layout,
// returns each cell's position on the board (the XZ plane, viewed from overhead).
// `ring` spaces them evenly around a circle; `half` spreads them over a semicircle;
// `track` is a straight row; `grid` fills 3 columns left-to-right, top-to-bottom.
// `centerZ` shifts the layout origin along Z (+Z = closer to camera bottom).

export type BoardLayout = "ring" | "half" | "track" | "grid";

export interface Cell {
  x: number;
  z: number;
}

/** A sensible default layout for `count` cells. */
export function defaultLayout(_count: number): BoardLayout {
  return "ring";
}

export function cellPositions(
  count: number,
  layout: BoardLayout,
  radius = 1.4,
  centerZ = 0,
): Cell[] {
  const n = Math.max(1, count);

  if (layout === "track") {
    if (n === 1) return [{ x: 0, z: centerZ }];
    return Array.from({ length: n }, (_, i) => ({
      x: -radius + (2 * radius * i) / (n - 1),
      z: centerZ,
    }));
  }

  if (layout === "half") {
    if (n === 1) return [{ x: 0, z: -radius + centerZ }];
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI + (i * Math.PI) / (n - 1);
      return { x: Math.cos(a) * radius, z: Math.sin(a) * radius + centerZ };
    });
  }

  if (layout === "grid") {
    const cols = 3;
    const rows = Math.ceil(n / cols);
    const dx = (2 * radius) / (cols - 1 || 1);
    const rowSpacing = dx; // square cells
    const totalH = (rows - 1) * rowSpacing;
    return Array.from({ length: n }, (_, i) => ({
      x: -radius + (i % cols) * dx,
      z: -totalH / 2 + Math.floor(i / cols) * rowSpacing + centerZ,
    }));
  }

  // ring (default) — always centered, ignores centerZ
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: Math.cos(a) * radius, z: Math.sin(a) * radius };
  });
}
