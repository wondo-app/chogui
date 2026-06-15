// Global Ladle provider — makes the catalog render like a real host.
//
// Two things a host does for inline tags are replicated here:
//   1. The theme + Tailwind/daisyUI utilities, by importing `sandbox.css` (which
//      pulls in the library's neutral preset and adds explicit `@source` dirs so
//      Tailwind scans the package tag source under Ladle's own Vite root;
//      compiled by `@tailwindcss/vite`, see .ladle/vite.config.ts). The wrapper
//      pins `data-theme="light"` — the library's neutral default theme (a host
//      layers its own brand theme on top; Wondo uses `wondo`).
//   2. Pack-shipped CSS injection. Importing the catalog bootstrap
//      (`../stories/_bootstrap`) registers every pack (core + samples), which
//      compiles each pack's `?inline` CSS into the style registry; we inject the
//      collected string as `<style data-choui-tag-styles>` exactly as a host's
//      reader does. So a tag with its own CSS (the `fx` sample) looks here as it
//      would in a host.

import "./sandbox.css";

import type { ReactNode } from "react";

import { getRegisteredTagStyles } from "../stories/_bootstrap";

export const Provider = ({ children }: { children: ReactNode }) => {
	const tagStyles = getRegisteredTagStyles();
	return (
		<div data-theme="light" className="min-h-screen bg-base-100 px-6 py-10 text-base-content">
			{tagStyles ? <style data-choui-tag-styles>{tagStyles}</style> : null}
			<div className="mx-auto max-w-2xl">{children}</div>
		</div>
	);
};
