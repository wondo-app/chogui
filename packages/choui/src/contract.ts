// Public contract for the library's inline story tags.
//
// This module is the stable surface community tag packs are authored against:
// it depends only on React types, never on host internals. Keeping it
// dependency-light is what lets the library build packs (including the core
// pack) without reaching into any specific reader.

import type { ReactNode } from "react";

import type { CoercedValue, PropSchema } from "./props";
import type { InlineTagKind } from "./tag-kind";

// The kind union lives in the React-free `./tag-kind` module so the `./manifest`
// and `./props` entries can reference it without pulling React into their types;
// re-exported here as the canonical name.
export type { InlineTagKind };

/** Runtime-supplied fields from the live reader. Absent in sandbox/SSR. */
export interface InlineTagRuntime {
	/** Observed Ink variables, surfaced from the state adapter. */
	observedVars?: Record<string, unknown>;
	/**
	 * Pending branch choices in index order (read-twin of `onSelectChoice`).
	 * Each `id` is the value accepted by `onSelectChoice(id)`. Absent when
	 * there is no live runtime (e.g. the Ladle sandbox). MAY be an empty
	 * array when a live runtime has no pending choices (e.g. a continue-gated
	 * beat) — a tag SHALL treat an empty array the same as absent and fall
	 * back to its authored props.
	 */
	choices?: ReadonlyArray<{ id: number; label: string }>;
	/** Choice-pick callback for tags that drive narration (e.g. `[link]`, `[board]`). */
	onSelectChoice?: (id: number) => void;
	/**
	 * Set a scalar story variable in response to an interaction — the write twin
	 * of the read-only `observedVars`. The host (live reader) routes this to the
	 * runtime bridge; the value persists via the existing replay snapshot. Absent
	 * when there is no live runtime (e.g. the Ladle sandbox), so a tag that uses
	 * it SHALL degrade gracefully (no-op) when it is undefined.
	 */
	onSetVariable?: (name: string, value: number | string | boolean) => void;
}

export interface InlineTagRenderContext {
	/**
	 * Raw attributes parsed off the opening tag, e.g. `{ width: "50%" }`. Always
	 * present and unmodified, so a schema-less tag reads exactly what the author
	 * typed (the `props` schema is additive — it never rewrites `attribs`).
	 */
	attribs: Record<string, string>;
	/**
	 * Typed attribute values, present only when the definition declares a `props`
	 * schema. Coerced and validated at the render boundary (string→number/boolean/
	 * enum), with invalid values replaced by the descriptor `default`. A tag that
	 * declares `props` should read its typed values from here; `attribs` remains
	 * available for anything outside the schema.
	 */
	props?: Record<string, CoercedValue>;
	/** Already-resolved inner content (empty for void tags). */
	children: ReactNode;
	/**
	 * Runtime-supplied fields from the live reader. Absent in sandbox/SSR.
	 * Tags that need observed variables, choices, or interaction callbacks
	 * read from here; tags that don't are unaffected.
	 */
	runtime?: InlineTagRuntime;
}

export interface InlineTagDefinition {
	/** Lowercased tag name, e.g. `highlight`. Matched case-insensitively. */
	name: string;
	kind: InlineTagKind;
	/**
	 * Optional declarative attribute schema. When present, the reader coerces the
	 * authored string attribs to the declared types before calling `render` (the
	 * typed values arrive on `ctx.props`), the craft validator checks authored
	 * attribs against it, and tooling derives controls + docs prop tables from it.
	 * Omit it and the tag simply receives raw `attribs` — fully back-compatible.
	 */
	props?: PropSchema;
	render(ctx: InlineTagRenderContext): ReactNode;
	/**
	 * Optional CSS this tag carries for custom styling outside of root theming.
	 * `registerInlineTag` forwards it to the tag-pack style registry, and the
	 * reader injects it once. Author it as a plain CSS *string constant* (the
	 * library bundles with tsup, which does not process Tailwind `?inline`
	 * imports): write resolved CSS — no `@apply`/`@reference` — and keep theme
	 * values as `var(--color-*)` (resolved at runtime by the consuming app's or
	 * the library's theme). The `daisy-*` packs' `TIMELINE_STYLES` /
	 * `HOVER_GALLERY_STYLES` and `packs/fx.ts`'s `fxStyles` are the reference
	 * examples.
	 *
	 * Must be a *static constant*: never interpolate author/reader input.
	 * Namespace your selectors under the tag's own neutral prefix (e.g.
	 * `choui-*`) so they cannot clobber reader or theme styles; theme tokens
	 * (`var(--color-*)`) are available.
	 */
	styles?: string;
}
