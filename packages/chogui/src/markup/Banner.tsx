import type { ReactNode } from "react";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const COLOR_CLASS: Record<string, string> = {
	info: "alert-info",
	success: "alert-success",
	warning: "alert-warning",
	error: "alert-error",
};
const STYLE_CLASS: Record<string, string> = {
	soft: "alert-soft",
	outline: "alert-outline",
	dash: "alert-dash",
};

/**
 * `[banner]…[/banner]` — a louder full-width block. Reserved for moments
 * the story wants to break the prose rhythm (chapter dedications, an
 * urgent dispatch, a "you have died" beat). A DaisyUI alert carries the
 * themed fill; `italic` keeps the literary flourish character. `variant`
 * defaults to `none` (no color) so it reads as a neutral banner rather than
 * a notice; set it to a semantic color for a louder beat.
 */
export function Banner({
	variant = "none",
	style = "soft",
	children,
}: {
	variant?: string;
	style?: string;
	children: ReactNode;
}) {
	const color = variant === "none" ? "" : (COLOR_CLASS[variant] ?? "");
	const treatment = STYLE_CLASS[style] ?? STYLE_CLASS.soft;
	return (
		<div className={`alert ${treatment} ${color} my-4 text-base italic`}>
			<span>{children}</span>
		</div>
	);
}
