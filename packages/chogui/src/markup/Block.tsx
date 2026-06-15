import type { CSSProperties, ReactNode } from "react";

/**
 * `[block width="50%"]…[/block]` — a constrained-width content block.
 * Useful for letters, quoted passages, or any prose the author wants
 * visually narrower than the main column. Width is an arbitrary CSS
 * length; the renderer trusts the author (it's still inside the prose
 * container's max-width).
 */
export function Block({
	width,
	children,
}: {
	width?: string;
	children: ReactNode;
}) {
	const style: CSSProperties | undefined = width ? { maxWidth: width } : undefined;
	return (
		<div className="mx-auto my-4" style={style}>
			{children}
		</div>
	);
}
