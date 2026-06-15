import { describe, expect, it } from "vitest";

import { fxSceneProcessor } from "../packs/fx";
import type { SceneSurface } from "../scene-processors";

function emptyScene(overrides: Partial<SceneSurface> = {}): SceneSurface {
	return {
		content: [],
		tags: {},
		...overrides,
	};
}

describe("fxSceneProcessor (sample community runtime pack)", () => {
	it("maps `# fx: aside` to the namespaced className directive", () => {
		const s = emptyScene({ tags: { fx: "aside" } });
		fxSceneProcessor(s);
		expect(s.className).toBe("choui-fx-aside");
	});

	it("reads the directive from a paragraph-level `# fx` tag", () => {
		const s = emptyScene({
			content: [{ tags: {} }, { tags: { fx: "warn" } }],
		});
		fxSceneProcessor(s);
		expect(s.className).toBe("choui-fx-warn");
	});

	it("sanitizes a messy value into a safe slug class", () => {
		const s = emptyScene({ tags: { fx: "  Big Reveal! " } });
		fxSceneProcessor(s);
		expect(s.className).toBe("choui-fx-big-reveal");
	});

	it("sets no className for a presence-only `# fx` (boolean true)", () => {
		const s = emptyScene({ tags: { fx: true } });
		fxSceneProcessor(s);
		expect(s.className).toBeUndefined();
	});

	it("sets no className when the value sanitizes to empty", () => {
		const s = emptyScene({ tags: { fx: "!!!" } });
		fxSceneProcessor(s);
		expect(s.className).toBeUndefined();
	});

	it("leaves className unset when no fx tag is present", () => {
		const s = emptyScene({
			content: [{ tags: {} }],
		});
		fxSceneProcessor(s);
		expect(s.className).toBeUndefined();
	});
});
