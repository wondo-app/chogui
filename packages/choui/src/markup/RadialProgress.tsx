import type { CSSProperties } from "react";

import { resolveValue } from "./resolve-value";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
// Radial-progress is tinted via the text color (the ring reads `currentColor`).
const COLOR_CLASS: Record<string, string> = {
	primary: "text-primary",
	info: "text-info",
	success: "text-success",
	warning: "text-warning",
	error: "text-error",
	neutral: "text-neutral",
};

/**
 * `[radial-progress value="{var}" max="{n}"]` — circular sibling of `[progress]`.
 * Reads the same literal/`{var}` value contract and renders DaisyUI's
 * `radial-progress`, whose fill is driven by the `--value` (0–100) custom
 * property; `--size` optionally sets the diameter.
 */
export function RadialProgress({
	value,
	max,
	variant = "primary",
	size,
	observed,
}: {
	value?: string;
	max?: number;
	variant?: string;
	size?: string;
	observed?: Record<string, unknown>;
}) {
	const numericMax = Math.max(1, max ?? 100);
	const raw = resolveValue(value, observed);
	const current = Math.max(0, Math.min(numericMax, raw));
	const pct = Math.round((current / numericMax) * 100);
	const color = COLOR_CLASS[variant] ?? COLOR_CLASS.primary;
	const style: Record<string, string | number> = { "--value": pct };
	if (size) style["--size"] = size;
	return (
		<div
			className={`radial-progress ${color} my-2`}
			style={style as CSSProperties}
			role="progressbar"
			aria-valuenow={pct}
			aria-label={`Progress ${pct} percent`}
		>
			{pct}%
		</div>
	);
}
