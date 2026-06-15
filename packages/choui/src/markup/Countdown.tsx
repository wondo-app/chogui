import { useEffect, useState, type CSSProperties } from "react";

import { resolveValue } from "./resolve-value";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const COLOR_CLASS: Record<string, string> = {
	primary: "text-primary",
	info: "text-info",
	success: "text-success",
	warning: "text-warning",
	error: "text-error",
	neutral: "text-neutral",
};

const MAX_VALUE = 999; // DaisyUI countdown `--value` accepts 0–999.

function clampValue(n: number): number {
	return Math.max(0, Math.min(MAX_VALUE, Math.round(n)));
}

function CountdownNumber({
	n,
	digits,
	colorClass,
}: {
	n: number;
	digits?: number;
	colorClass: string;
}) {
	const style: Record<string, string | number> = { "--value": n };
	if (digits) style["--digits"] = digits;
	return (
		<span className={`countdown font-mono ${colorClass}`}>
			<span style={style as CSSProperties} aria-live="polite" aria-label={String(n)}>
				{n}
			</span>
		</span>
	);
}

// Client island: counts down once from `from` to 0 on mount, then stops. The
// interval is cleared at zero and on unmount. Returned as a component (not run
// in the tag's `render`) so the hooks run in React's reconciler.
function TickingCountdown({
	from,
	digits,
	colorClass,
}: {
	from: number;
	digits?: number;
	colorClass: string;
}) {
	const start = clampValue(from);
	const [n, setN] = useState(start);
	useEffect(() => {
		if (start <= 0) return;
		const id = setInterval(() => {
			setN((prev) => {
				if (prev <= 1) {
					clearInterval(id);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [start]);
	return <CountdownNumber n={n} digits={digits} colorClass={colorClass} />;
}

/**
 * `[countdown value="{var}"]` — DaisyUI countdown. Dual-mode:
 *   - default: a STATIC `--value` display, resolving `value` from a literal or
 *     a `{var}` reference exactly like `[progress]` (no timer).
 *   - `tick="true" from="N"`: a client island that decrements once from `N` to 0
 *     on mount and stops.
 */
export function Countdown({
	value,
	max,
	digits,
	variant,
	tick,
	from,
	observed,
}: {
	value?: string;
	max?: number;
	digits?: number;
	variant?: string;
	tick?: boolean;
	from?: number;
	observed?: Record<string, unknown>;
}) {
	const colorClass = variant ? (COLOR_CLASS[variant] ?? "") : "";
	if (tick) {
		return <TickingCountdown from={from ?? 0} digits={digits} colorClass={colorClass} />;
	}
	let n = resolveValue(value, observed);
	if (max != null) n = Math.min(max, n); // clampValue still floors at 0, so 0 displays
	return <CountdownNumber n={clampValue(n)} digits={digits} colorClass={colorClass} />;
}
