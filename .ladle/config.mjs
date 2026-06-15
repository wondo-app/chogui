// Ladle catalog config. Inline (React) tags only — runtime scene-processor tags
// have no inline UI, so they are reader behaviors, not stories.
/** @type {import("@ladle/react").UserConfig} */
export default {
	stories: "stories/**/*.stories.{ts,tsx}",
	// Standalone Vite config that wires Tailwind v4 for the catalog (there is no
	// host app whose Vite the catalog could borrow).
	viteConfig: ".ladle/vite.config.ts",
};
