// Shared value resolver for the numeric-display tags (`progress`,
// `radial-progress`, `countdown`). An authored `value` is either a plain
// numeric literal or a `{var}` reference to an observed Ink variable; this
// resolves it to a number at render time so the tag reacts live. Never throws —
// an unresolved/invalid expression resolves to 0.
export function resolveValue(
	expression: string | undefined,
	observed: Record<string, unknown> | undefined,
): number {
	if (!expression) return 0;
	const trimmed = expression.trim();
	// Plain numeric literal.
	const numeric = Number.parseFloat(trimmed);
	if (Number.isFinite(numeric) && /^[-+]?[0-9]/.test(trimmed)) return numeric;
	// `{var}` reference.
	const match = /^\{([A-Za-z_][A-Za-z0-9_]*)\}$/.exec(trimmed);
	if (match && observed) {
		const v = observed[match[1]!];
		if (typeof v === "number" && Number.isFinite(v)) return v;
		if (typeof v === "string") {
			const parsed = Number.parseFloat(v);
			if (Number.isFinite(parsed)) return parsed;
		}
		return 0;
	}
	// Non-numeric, non-variable input — likely a typo. Warn in dev so the
	// author can catch `[progress value="typo"]` instead of silently seeing 0%.
	if (typeof console !== "undefined" && !Number.isFinite(Number.parseFloat(trimmed))) {
		console.warn(`[chogui] resolveValue: "${trimmed}" is not a number or {variable}; resolving to 0.`);
	}
	return 0;
}

// Resolve a comma-separated list of value expressions — one per die for the
// `[dice]` visualizer (`value="{a},{b}"` → `[3, 5]`). Each item is a literal or
// a `{var}` ref resolved via `resolveValue`. Empty/blank input → `[]`.
export function resolveValues(
	expression: string | undefined,
	observed: Record<string, unknown> | undefined,
): number[] {
	if (!expression) return [];
	return expression
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.map((part) => resolveValue(part, observed));
}
