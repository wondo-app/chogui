/**
 * `[---]` — a horizontal divider. Atrament's vocabulary uses this shorthand
 * for scene-break-style separators inside prose. Renders as a centered
 * hairline using DaisyUI border tokens.
 */
export function Divider() {
	return (
		<hr className="border-base-content/15 my-6 w-1/3 mx-auto border-t" />
	);
}
