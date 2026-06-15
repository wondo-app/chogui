import type { ReactNode } from "react";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const COLOR_CLASS: Record<string, string> = {
	primary: "link-primary",
	info: "link-info",
	success: "link-success",
	warning: "link-warning",
	error: "link-error",
	neutral: "link-neutral",
};

/**
 * `[link choice="<choice-id>"]…[/link]` — Atrament's hypertext-mode link.
 * Renders a button styled as a prose link; clicking it selects the
 * referenced choice id. The choice is consumed by the reader-bus state
 * coupling Atrament Core's `makeChoice` to the next `# pause` advancement.
 * `variant` picks the DaisyUI link color; `hover` underlines only on hover.
 */
export function ChoiceLink({
	choice,
	variant = "primary",
	hover = false,
	onSelectChoice,
	children,
}: {
	choice?: number;
	variant?: string;
	hover?: boolean;
	onSelectChoice?: (id: number) => void;
	children: ReactNode;
}) {
	const valid = typeof choice === "number" && Number.isFinite(choice) && choice >= 0;
	const color = COLOR_CLASS[variant] ?? COLOR_CLASS.primary;
	return (
		<button
			type="button"
			disabled={!valid}
			onClick={() => valid && choice != null && onSelectChoice?.(choice)}
			className={`link ${color} ${hover ? "link-hover" : "underline"} disabled:no-underline disabled:text-base-content/50`}
		>
			{children}
		</button>
	);
}
