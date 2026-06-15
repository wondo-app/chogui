import { useState, type ReactNode } from "react";

/**
 * `[spoiler]…[/spoiler]` — content hidden behind a click-to-reveal mask.
 * Inline. Uses a native button for keyboard + screen-reader access.
 */
export function Spoiler({ children }: { children: ReactNode }) {
	const [revealed, setRevealed] = useState(false);
	if (revealed) return <span>{children}</span>;
	return (
		<button
			type="button"
			className="inline-block bg-base-content/15 text-transparent hover:bg-base-content/25 rounded-sm px-1 cursor-pointer select-none"
			aria-label="Spoiler — click to reveal"
			onClick={() => setRevealed(true)}
		>
			{children}
		</button>
	);
}
