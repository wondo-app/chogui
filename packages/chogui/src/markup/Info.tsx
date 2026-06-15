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
 * `[info]…[/info]` — quiet sidebar note. A DaisyUI alert with no dismiss;
 * suitable for in-prose asides ("This NPC is a member of the Silver Order,
 * see the codex."). `variant` picks the semantic color and `style` the alert
 * treatment; both carry the themed fill, so no manual `bg-*`/`text-*` overrides
 * are needed.
 */
export function Info({
	variant = "info",
	style = "soft",
	children,
}: {
	variant?: string;
	style?: string;
	children: ReactNode;
}) {
	const color = COLOR_CLASS[variant] ?? COLOR_CLASS.info;
	const treatment = STYLE_CLASS[style] ?? STYLE_CLASS.soft;
	return (
		<aside className={`alert ${treatment} ${color} my-3 text-sm`}>
			<span>{children}</span>
		</aside>
	);
}
