// Markup renderer — turns authored bracket markup into rendered tag components.
//
// This is the host-agnostic core of the reader's markup surface, extracted from
// the host so the library owns it. It parses prose containing XML-shaped tags
// via html-react-parser and maps each known tag to its registered component.
// Unknown tags fall back to their literal source text (no throw) so an
// unrecognized newer tag in an older reader degrades gracefully.
//
// The custom-element prefix is a parameter, not a module constant: a host
// supplies its own (e.g. Wondo passes `wondo-`) so previously authored and
// persisted markup keeps rendering unchanged, while the library default is a
// neutral prefix. The prefix only affects the *transient* custom-element name
// during parsing — it is never stored.
//
// ⚠️ CLIENT-ONLY: html-react-parser requires
// `document.implementation.createHTMLDocument`, absent in Node.js. Any component
// that renders the result must be mounted client-only (never SSR'd).

import parse, {
	type DOMNode,
	domToReact,
	Element,
	type HTMLReactParserOptions,
} from "html-react-parser";

import type { InlineTagDefinition, InlineTagRuntime } from "../contract";
import { coerceProps } from "../props";
import {
	getInlineTag as defaultGetInlineTag,
	getInlineTagNames as defaultGetInlineTagNames,
} from "../registry";

/** The library's neutral default custom-element prefix. A host overrides it. */
export const DEFAULT_MARKUP_PREFIX = "ui-";

export interface StoryMarkupProps {
	source: string;
	/** Runtime-supplied fields from the live reader. Absent in sandbox/SSR. */
	runtime?: InlineTagRuntime;
}

export interface CreateStoryMarkupOptions {
	/** Custom-element prefix used while rewriting bracket markup. Defaults to {@link DEFAULT_MARKUP_PREFIX}. */
	prefix?: string;
	/** Registry lookup for a single tag by (unprefixed) name. Defaults to the library registry. */
	getInlineTag?: (name: string) => InlineTagDefinition | undefined;
	/** Registry lookup for all registered (unprefixed) tag names. Defaults to the library registry. */
	getInlineTagNames?: () => string[];
}

const SQUARE_HORIZONTAL_RULE = /\[---\]/g;
const SQUARE_CLOSE_TAG = /\[\/([A-Za-z][A-Za-z0-9_-]*)\]/g;
const SQUARE_OPEN_TAG =
	/\[([A-Za-z][A-Za-z0-9_-]*)((?:\s+[A-Za-z_][\w-]*=(?:"[^"]*"|'[^']*'))*)\s*\]/g;

/**
 * Build a markup renderer bound to a prefix and registry.
 *
 * The square-bracket → custom-element rewrite reads the prefix from here, so the
 * same library renders for any host. Markup uses square brackets, not XML angles;
 * before handing source to html-react-parser we rewrite, prefixing every tag so
 * it qualifies as a custom element (without the prefix, names that collide with
 * native HTML elements — notably `picture` — consume subsequent content). Only
 * names present in the registry are rewritten; anything else in square brackets
 * (`[admin]`, `[1, 2, 3]`, a code example in prose) is left as literal text.
 */
export function createStoryMarkup(options: CreateStoryMarkupOptions = {}) {
	const prefix = options.prefix ?? DEFAULT_MARKUP_PREFIX;
	const getInlineTag = options.getInlineTag ?? defaultGetInlineTag;
	const getInlineTagNames = options.getInlineTagNames ?? defaultGetInlineTagNames;

	function squareToAngle(source: string): string {
		const isVoid = (tag: string) => getInlineTag(tag)?.kind === "void";
		const isKnown = (tag: string) => getInlineTagNames().includes(tag);
		return (
			source
				// HTML5 disallows self-closing custom elements (`<ui-divider />` is
				// parsed as `<ui-divider>` and swallows trailing content). For every
				// "void" tag we emit an explicit empty paired form so parsing
				// terminates cleanly.
				.replace(SQUARE_HORIZONTAL_RULE, `<${prefix}divider></${prefix}divider>`)
				.replace(SQUARE_CLOSE_TAG, (match, name: string) => {
					const tag = name.toLowerCase();
					if (!isKnown(tag)) return match; // not a registered tag — leave literal
					return `</${prefix}${tag}>`;
				})
				.replace(SQUARE_OPEN_TAG, (match, name: string, attrs: string) => {
					const tag = name.toLowerCase();
					if (!isKnown(tag)) return match; // not a registered tag — leave literal
					if (isVoid(tag)) return `<${prefix}${tag}${attrs}></${prefix}${tag}>`;
					return `<${prefix}${tag}${attrs}>`;
				})
		);
	}

	function StoryMarkup({ source, runtime }: StoryMarkupProps) {
		const prepared = squareToAngle(source);

		const parserOptions: HTMLReactParserOptions = {
			// html-react-parser's `replace` typing is loose (returns
			// string | boolean | void | object | Element); we return ReactNode.
			// Cast at the boundary — every concrete return below is a valid child.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			replace(node: DOMNode): any {
				if (!(node instanceof Element)) return undefined;
				const name = node.name?.toLowerCase();
				if (!name?.startsWith(prefix)) return undefined;
				const def = getInlineTag(name.slice(prefix.length));
				if (!def) return undefined;
				const attribs = node.attribs ?? {};
				// Coerce authored string attribs to declared types when the tag
				// declares a `props` schema. Coercion never throws — invalid values
				// fall back to the descriptor default and surface as warnings the
				// author-time craft validator reports; the live reader ignores them.
				// Schema-less tags get no `props` and read raw `attribs`.
				const props = def.props ? coerceProps(attribs, def.props).props : undefined;
				return def.render({
					attribs,
					props,
					children: domToReact(node.children as DOMNode[], parserOptions),
					runtime,
				});
			},
		};

		return <>{parse(prepared, parserOptions)}</>;
	}

	return StoryMarkup;
}

/**
 * Default-bound renderer using the library registry and the neutral default
 * prefix. Hosts that need a custom prefix call {@link createStoryMarkup} instead.
 */
export const StoryMarkup = createStoryMarkup();

// The `./markup` subpath is the optional layer for engines that emit bracket
// markup: the renderer (above) plus the registry, the inline-tag contract, and
// the shipped packs a host composes. Components themselves live at `.` / `./ui`.

export type {
	InlineTagDefinition,
	InlineTagKind,
	InlineTagRenderContext,
	InlineTagRuntime,
} from "../contract";
export type { StoryStateAdapter, StoryVariableValue } from "../adapter";
export {
	getInlineTag,
	getInlineTagNames,
	hasInlineTag,
	registerInlineTag,
	registerInlineTags,
} from "../registry";
export { getRegisteredTagStyles, registerTagStyles } from "../styles";
export type {
	SceneProcessor,
	SceneProcessorContext,
	SceneProcessorFactory,
	SceneSurface,
} from "../scene-processors";
export {
	getSceneProcessors,
	registerSceneProcessor,
	registerSceneProcessors,
} from "../scene-processors";
export { coreInlineTags } from "../builtins";
export { kbdPack } from "../packs/kbd";
export { phoneChatPack } from "../packs/phone-chat";
export { daisyDisplayPack } from "../packs/daisy-display";
export { daisySequencePack } from "../packs/daisy-sequence";
export { daisyMotionPack } from "../packs/daisy-motion";
export { gamePack } from "../packs/game";
export { registerSampleRuntimePacks } from "../runtime";
