import { resolveValue } from "./resolve-value";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const COLOR_CLASS: Record<string, string> = {
	primary: "progress-primary",
	info: "progress-info",
	success: "progress-success",
	warning: "progress-warning",
	error: "progress-error",
	neutral: "progress-neutral",
};

/**
 * `[progress value="{var}" max="{n}"]` — visual fill bar reading from an
 * observed Ink LIST/VAR (declared with `# observe: <name>`). The reader
 * passes the observed vars down (via the state adapter's onChange wiring);
 * this component looks the value up at render time so it reacts live.
 */
export function Progress({
	value,
	max,
	variant = "primary",
	observed,
}: {
	value?: string;
	max?: number;
	variant?: string;
	observed?: Record<string, unknown>;
}) {
	const numericMax = Math.max(1, max ?? 100);
	const raw = resolveValue(value, observed);
	const current = Math.max(0, Math.min(numericMax, raw));
	const pct = Math.round((current / numericMax) * 100);
	const color = COLOR_CLASS[variant] ?? COLOR_CLASS.primary;
	// Native <progress> takes raw value + max; DaisyUI's `.progress` styling
	// scales the rendered fill from that ratio. Passing value=current/max=numericMax
	// is the semantically correct contract — `value` is the raw measurement,
	// not a precomputed percentage. See kimi-review §7.
	return (
		<progress
			className={`progress ${color} w-full max-w-xs my-2`}
			value={current}
			max={numericMax}
			aria-label={`Progress ${pct} percent`}
		/>
	);
}
