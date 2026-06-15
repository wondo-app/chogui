// Tag-pack style registry — the CSS half of the story-tag contract.
//
// A tag pack may carry its own CSS for custom styling *outside of root theming*.
// The pack authors it as a plain CSS *string constant* — resolved CSS, no
// `@apply`/`@reference`, theme values left as `var(--color-*)` (resolved at
// runtime by the consuming app's or the library's theme). The library bundles
// with tsup, which does not process Tailwind `?inline` imports, so a co-located
// `.css?inline` would not survive the build. `packs/fx.ts`'s `fxStyles` and the
// `daisy-*` packs' `TIMELINE_STYLES` / `HOVER_GALLERY_STYLES` are the reference
// examples. The pack hands that string here: inline packs via the `styles` field
// on their `InlineTagDefinition` (forwarded by `registerInlineTag`), runtime
// packs via a direct `registerTagStyles` call at bootstrap. The reader injects
// the concatenated result once into a single `<style>` element.
//
// This does NOT widen the build-time ceiling: the CSS is bundled and
// curation-gated exactly like the pack's render/processor code — there is still
// no runtime loading. It only removes the separate "operator hand-edits
// tokens.css" step for per-tag custom styling; root theming (`# THEME` palettes)
// stays operator-owned in tokens.css.
//
// Keyed by `id` so re-registration (or registration from both bootstrap entry
// points — the island and the narrator session factory) is idempotent.

const styleRegistry = new Map<string, string>();

export function registerTagStyles(id: string, css: string): void {
	styleRegistry.set(id.toLowerCase(), css);
}

export function getRegisteredTagStyles(): string {
	return [...styleRegistry.values()].join("\n");
}
