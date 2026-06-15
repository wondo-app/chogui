// `random` — the value SOURCE for `[roll]`. Pure logic, no React, no dice-box:
// parse dice notation, roll the dice (client RNG), and total them. The view
// (dice-box) visualizes the per-die `values` as a predetermined outcome; the
// `total` (with modifier) is what `[roll]` assigns to a story variable.
//
// Determinism note: the client RNG here is fine because the assigned value is
// recorded in the reader's `vars` snapshot and reproduced on replay — the roll
// is an external input, not engine-derived randomness.

export interface RollSpec {
	/** Number of dice (the `N` in `NdM`). */
	count: number;
	/** Faces per die (the `M` in `NdM`). */
	faces: number;
	/** Flat modifier added to the sum (the `±K`). */
	modifier: number;
}

export interface RollResult {
	spec: RollSpec;
	/** Individual die results, in order — fed to the dice-box as predetermined values. */
	values: number[];
	/** `sum(values) + modifier` — the value assigned to the story variable. */
	total: number;
}

// `NdM±K`: count optional (defaults 1), modifier optional. e.g. `2d6+3`, `d20`, `3d8-1`.
const NOTATION_RE = /^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/i;

const MAX_DICE = 100;
const MAX_FACES = 1000;

export function parseNotation(notation: string | undefined): RollSpec | null {
	if (!notation) return null;
	const m = NOTATION_RE.exec(notation);
	if (!m) return null;
	const count = m[1] ? Number.parseInt(m[1], 10) : 1;
	const faces = Number.parseInt(m[2]!, 10);
	const modifier = m[3] ? Number.parseInt(m[3].replace(/\s+/g, ""), 10) : 0;
	if (count < 1 || count > MAX_DICE) return null;
	if (faces < 2 || faces > MAX_FACES) return null;
	return { count, faces, modifier };
}

// Uniform integer in 1..maxInclusive. Uses crypto when available (rejection
// sampling to avoid modulo bias); falls back to Math.random.
export function randomInt(maxInclusive: number): number {
	const g = globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } };
	if (g.crypto?.getRandomValues) {
		const range = maxInclusive;
		const limit = Math.floor(0x1_0000_0000 / range) * range;
		const arr = new Uint32Array(1);
		let x: number;
		do {
			g.crypto.getRandomValues(arr);
			x = arr[0]!;
		} while (x >= limit);
		return (x % range) + 1;
	}
	return Math.floor(Math.random() * maxInclusive) + 1;
}

/** Roll the notation. Returns null for invalid/out-of-range notation. */
export function rollNotation(notation: string | undefined): RollResult | null {
	const spec = parseNotation(notation);
	if (!spec) return null;
	const values = Array.from({ length: spec.count }, () => randomInt(spec.faces));
	const total = values.reduce((a, b) => a + b, 0) + spec.modifier;
	return { spec, values, total };
}

/**
 * The dice-box-threejs predetermined notation for a result, e.g. `2d6@3,5`.
 * The flat modifier is intentionally omitted here — the dice visualize the raw
 * per-die values; the modifier lives only in `result.total`.
 */
export function predeterminedNotation(result: RollResult): string {
	return `${result.spec.count}d${result.spec.faces}@${result.values.join(",")}`;
}

/**
 * Predetermined notation for SHOWING already-decided per-die `values` (the
 * read-only visualizer path — `[dice]`). Faces come from `notation`; the die
 * count is how many values are supplied (one die per value); each value is
 * rounded and clamped into `[1, faces]` so an out-of-range Ink value can't ask
 * for an impossible face. Returns null for invalid notation or no values.
 * e.g. `("d6", [4])` → `"1d6@4"`, `("d6", [3, 5])` → `"2d6@3,5"`.
 */
export function predeterminedNotationFor(
	notation: string | undefined,
	values: number[],
): string | null {
	const spec = parseNotation(notation);
	if (!spec || values.length === 0) return null;
	const clamped = values.map((v) => Math.min(spec.faces, Math.max(1, Math.round(v))));
	return `${clamped.length}d${spec.faces}@${clamped.join(",")}`;
}
