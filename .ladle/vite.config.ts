// Standalone Vite config for the Ladle catalog (referenced by .ladle/config.mjs
// via `viteConfig`). The catalog has no host app whose Vite it could borrow, so
// the one piece it needs — Tailwind v4 — is wired here directly. With
// `@tailwindcss/vite` present, importing `sandbox.css` in .ladle/components.tsx
// compiles the library's neutral theme, and each pack's `?inline` CSS (e.g. the
// `fx` sample) compiles through the same pipeline a host reader uses.

import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";

export default {
	plugins: [tailwindcss()],
	// Serve the repo's public/ (where chogui-three assets are vendored by
	// scripts/copy-assets.mjs). Ladle runs Vite from its own root, so this
	// must be an absolute path or the catalog 404s /assets/chogui-three/*.
	publicDir: resolve(process.cwd(), "public"),
	// Dev sandbox is often viewed through a Cloudflare quick tunnel, whose
	// subdomain rotates each run; allow the whole domain so the host check
	// doesn't reject it. Leading dot = match all subdomains.
	server: {
		allowedHosts: [".trycloudflare.com"],
	},
};
