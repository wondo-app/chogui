import { defineConfig } from "tsup";

// The library's public entry points, one bundle each. The keys become the
// emitted filenames (`dist/<key>.js` + `.d.ts`) the `exports` map points at.
//
// `./css` and `./preset` are CSS artifacts produced by the separate Tailwind
// build (`build:css`), not tsup entries.
export default defineConfig({
	entry: {
		index: "src/index.ts",
		markup: "src/markup-renderer/index.tsx",
		ui: "src/ui/index.ts",
		manifest: "src/manifest.ts",
		props: "src/props.ts",
	},
	format: ["esm"],
	dts: true,
	treeshake: true,
	sourcemap: true,
	clean: true,
	// Peers + the sibling 3D engine stay external — the host (or the consumer)
	// provides React, lucide, the markup parser, and `choui-three` is lazily
	// imported so `three`/`cannon-es` never enter this bundle.
	external: [
		"react",
		"react-dom",
		"react/jsx-runtime",
		"lucide-react",
		"html-react-parser",
		"@wondo-app/choui-three",
	],
});
