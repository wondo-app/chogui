import type { ReactNode } from "react";

/**
 * `[highlight]…[/highlight]` — call attention to a word or short phrase
 * inline. Renders with a subtle accent color from DaisyUI's theme tokens
 * (not a raw hex) so it stays inside the `wondo` / `wondo-dark` palette.
 */
export function Highlight({ children }: { children: ReactNode }) {
	return <mark className="bg-accent/20 text-accent-content px-0.5 rounded-sm">{children}</mark>;
}
