// Pure index math for the spinning top — no WebGL, unit-tested. The host decides the
// winning face (value = its index); this clamps it to a valid range.

/** Clamp a resolved value to a valid face index in `[0, count)`. */
export function resolveSegmentIndex(value: number, count: number): number {
  if (count <= 0) return 0;
  const i = Math.round(value);
  if (!Number.isFinite(i)) return 0;
  return Math.min(count - 1, Math.max(0, i));
}
