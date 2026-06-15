import { describe, expect, it } from "vitest";

import { registerInlineTag } from "../registry";
// Literal CSS strings throughout — this exercises the registry contract only,
// never the `?inline` Tailwind pipeline (vitest does not run @tailwindcss/vite).
import { getRegisteredTagStyles, registerTagStyles } from "../styles";

describe("tag-pack style registry", () => {
	it("registers CSS and surfaces it from getRegisteredTagStyles", () => {
		registerTagStyles("alpha", ".wondo-alpha{color:red}");
		expect(getRegisteredTagStyles()).toContain(".wondo-alpha{color:red}");
	});

	it("dedupes/overwrites by id — latest CSS wins, no stale copy lingers", () => {
		registerTagStyles("beta", ".wondo-beta{stale:1}");
		registerTagStyles("beta", ".wondo-beta{fresh:2}");
		const css = getRegisteredTagStyles();
		expect(css).toContain(".wondo-beta{fresh:2}");
		expect(css).not.toContain(".wondo-beta{stale:1}");
	});

	it("keys ids case-insensitively (so the two bootstrap entry points dedupe)", () => {
		registerTagStyles("Gamma", ".wondo-gamma{stale:1}");
		registerTagStyles("gamma", ".wondo-gamma{fresh:2}");
		const css = getRegisteredTagStyles();
		expect(css).toContain(".wondo-gamma{fresh:2}");
		expect(css).not.toContain(".wondo-gamma{stale:1}");
	});

	it("concatenates distinct packs newline-separated", () => {
		registerTagStyles("delta", ".wondo-delta{x:1}");
		registerTagStyles("epsilon", ".wondo-epsilon{y:2}");
		const lines = getRegisteredTagStyles().split("\n");
		expect(lines).toContain(".wondo-delta{x:1}");
		expect(lines).toContain(".wondo-epsilon{y:2}");
	});
});

describe("registerInlineTag forwards a pack's `styles` to the style registry", () => {
	it("makes a registered def's styles appear in getRegisteredTagStyles()", () => {
		registerInlineTag({
			name: "Boxed",
			kind: "paired",
			render: ({ children }) => children,
			styles: ".wondo-boxed{border:1px solid}",
		});
		expect(getRegisteredTagStyles()).toContain(".wondo-boxed{border:1px solid}");
	});

	it("keys forwarded CSS by the lowercased tag name (overwrite on re-register)", () => {
		registerInlineTag({
			name: "Stamped",
			kind: "paired",
			render: ({ children }) => children,
			styles: ".wondo-stamped{v:1}",
		});
		registerInlineTag({
			name: "stamped",
			kind: "paired",
			render: ({ children }) => children,
			styles: ".wondo-stamped{v:2}",
		});
		const css = getRegisteredTagStyles();
		expect(css).toContain(".wondo-stamped{v:2}");
		expect(css).not.toContain(".wondo-stamped{v:1}");
	});

	it("adds nothing when a def carries no styles", () => {
		const before = getRegisteredTagStyles();
		registerInlineTag({
			name: "plain",
			kind: "paired",
			render: ({ children }) => children,
		});
		expect(getRegisteredTagStyles()).toBe(before);
	});
});
