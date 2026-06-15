import { useCallback, useMemo, useRef, useState } from "react";

import { predeterminedNotationFor, rollNotation } from "../logic/random";
import { use3DDevice } from "./use3DDevice";

// The `dice` VIEW: a choui-three DiceDevice visualizer. Client-only — it
// dynamic-imports the heavy lib on mount so it stays out of the main reader
// bundle, and is SSR-guarded.
//
// Two modes:
//   - CONTROLLED (the `[dice]` tag): `values` are passed in — already decided in
//     Ink. The component only *visualizes* them (no client RNG, no variable
//     write); it tumbles to those faces on mount, or on a click when
//     `reveal="click"`. This is the replay-safe path — Ink owns the randomness.
//   - UNCONTROLLED (the Ladle tuning story only): no `values`, so it self-rolls
//     with a click for in-browser theme tuning. Not exposed by any author tag.
//
// Robustness: the value NEVER depends on the 3D succeeding — in controlled mode
// the value is the prop; in self-roll mode it is computed up front. The 3D is
// decoration.

// Tray dimensions (full literals so Tailwind emits them).
// Sized for the ~600px Wondo reader — lg fills ~85% of prose width.
const SIZE_TRAY: Record<string, string> = {
	sm: "h-[120px] w-[260px]",
	md: "h-[180px] w-[380px]",
	lg: "h-[240px] w-[520px]",
};
// Pixel width/height per size — must match SIZE_TRAY so the renderer fills the
// box exactly (no clipping) and the camera gets the correct aspect ratio.
const SIZE_PX_W: Record<string, number> = { sm: 260, md: 380, lg: 520 };
const SIZE_PX_H: Record<string, number> = { sm: 120, md: 180, lg: 240 };

interface DiceRollerProps {
	/** Dice notation — faces (and, when self-rolling, count/modifier), e.g. `d20`, `2d6+3`. */
	notation: string;
	/**
	 * CONTROLLED mode: already-decided per-die face values to visualize (one die
	 * per value). When present the component does NOT roll its own RNG — it only
	 * tumbles to these faces. Omit for the self-roll (Ladle) mode.
	 */
	values?: number[];
	/**
	 * Controlled-mode cosmetic trigger: `auto` (default) tumbles on mount; `click`
	 * waits for a reader gesture to play the reveal. Ignored when self-rolling.
	 */
	reveal?: "auto" | "click";
	/** Self-roll mode: called with the final total once the roll resolves. */
	onResult?: (total: number) => void;
	/** Self-roll mode: disable re-rolling after the first result. */
	once?: boolean;
	/** Tray + dice size. */
	size?: string;
	/** Dice color variant. */
	color?: string;
	/** Surface texture overriding the colorset's (e.g. `paper`, `marble`, `wood`). */
	texture?: string;
	/** Numeral color override: `auto` (colorset default), `light`, or `dark`. */
	pips?: string;
	/** Play the dice-box hit/surface sounds. Off by default (restrained). */
	sound?: boolean;
	/** Enable soft shadows. */
	shadow?: boolean | number;
}

export function DiceRoller({
	notation,
	values,
	reveal = "auto",
	onResult,
	once = true,
	size = "md",
	color = "bone",
	texture,
	pips,
	sound = false,
	shadow,
}: DiceRollerProps) {
	const [rolling, setRolling] = useState(false);
	const [result, setResult] = useState<number | null>(null);
	const stageRef = useRef<{ settle(): void; showImmediately(): void } | null>(null);
	const mountedRef = useRef(true);

	const controlled = Array.isArray(values);
	const widthPx = SIZE_PX_W[size] ?? SIZE_PX_W.md;
	const heightPx = SIZE_PX_H[size] ?? SIZE_PX_H.md;
	const immediate =
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// Build the predetermined notation if values are provided. The helper derives
	// the die COUNT from the value list (`("d6", [3, 5])` → `"2d6@3,5"`) — a
	// hand-built `d6@3,5` would keep the notation's implicit count of one and
	// render a single die no matter how many values were authored.
	const diceNotation = useMemo(() => {
		if (controlled && values && values.length > 0) {
			return predeterminedNotationFor(notation, values) ?? notation;
		}
		return notation;
	}, [controlled, values, notation]);

	// Roll complete callback for self-roll mode.
	const handleRollComplete = useCallback(
		(res: { total?: number }) => {
			if (typeof res.total === "number") {
				setResult(res.total);
				onResult?.(res.total);
			}
			setRolling(false);
		},
		[onResult],
	);

	const { containerRef, failed } = use3DDevice(
		(mod, container) => {
			const stage = new mod.Stage(container, {
				width: widthPx,
				height: heightPx,
				view: "dice",
				shadow,
			});
			const device = new mod.DiceDevice({
				notation: diceNotation,
				...(controlled ? {} : {}),
				color,
				texture,
				pips,
				sound,
				trayAspect: widthPx / heightPx,
				onRollComplete: controlled ? undefined : handleRollComplete,
			});
			stage.add(device);
			stageRef.current = stage;

			// Auto-settle unless reveal === "click" (deferred) or uncontrolled
			// (self-roll mode — settle on click). Reduced motion skips the
			// animation but still respects the click gate.
			if (controlled && reveal !== "click") {
				if (immediate) stage.showImmediately();
				else stage.settle();
			}

			return stage;
		},
		[diceNotation, color, texture, pips, sound, shadow, widthPx, heightPx, controlled, reveal],
	);

	// Click handler for reveal/self-roll. Under reduced motion, use
	// showImmediately() instead of settle() to skip the animation.
	const handleClick = () => {
		if (rolling) return;
		if (controlled) {
			setRolling(true);
			if (immediate) {
				stageRef.current?.showImmediately();
				setRolling(false);
			} else {
				stageRef.current?.settle();
				setTimeout(() => { if (mountedRef.current) setRolling(false); }, 100);
			}
		} else {
			// Self-roll mode: compute value and trigger roll.
			if (once && result !== null) return;
			setRolling(true);
			const r = rollNotation(notation);
			if (!r) {
				setRolling(false);
				return;
			}
			setResult(r.total);
			onResult?.(r.total);
			setRolling(false);
		}
	};

	const label = controlled
		? `Dice showing ${(values ?? []).join(", ")}`
		: result !== null
			? `Rolled ${result}`
			: `Roll ${notation}`;

	const tray = (
		<span
			ref={containerRef}
			role={controlled ? "img" : undefined}
			aria-hidden={controlled ? undefined : "true"}
			aria-label={controlled ? label : undefined}
			className={`block overflow-hidden rounded-[var(--radius-field,0.5rem)] ${SIZE_TRAY[size] ?? SIZE_TRAY.md}`}
		/>
	);

	if (failed) {
		// 3D unavailable — show text fallback.
		const fallbackLabel = controlled
			? (values ?? []).join(", ")
			: result !== null
				? `${result}`
				: notation;
		return (
			<span className="inline-flex flex-col items-start gap-1 align-bottom">
				<span className="badge badge-neutral" aria-live="polite">
					{fallbackLabel}
				</span>
			</span>
		);
	}

	if (controlled) {
		return (
			<span className="inline-flex flex-col items-start gap-1 align-bottom">
				{tray}
				{reveal === "click" ? (
					<button
						type="button"
						onClick={handleClick}
						disabled={rolling}
						className="btn btn-primary btn-sm"
						aria-label={`Roll ${notation}`}
					>
						{rolling ? "Rolling…" : "Roll"}
					</button>
				) : null}
			</span>
		);
	}

	const done = once && result !== null;

	return (
		<span className="inline-flex flex-col items-start gap-1 align-bottom">
			{tray}
			<button
				type="button"
				onClick={handleClick}
				disabled={rolling || done}
				className="btn btn-primary btn-sm"
				aria-label={label}
			>
				{result !== null ? `Rolled ${result}` : rolling ? "Rolling…" : `Roll ${notation}`}
			</button>
		</span>
	);
}
