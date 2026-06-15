// Shared sandbox helpers for the Ladle tag stories.
//
// This is NOT a story file (no `.stories` suffix, so Ladle does not collect it).
// It is the single place that turns a tag's declared `props` schema into Ladle
// controls and assembles author-syntax source strings — so the stories stay
// schema-driven (controls are *derived*, never hand-authored). The stories
// render those author strings through the REAL `StoryMarkup`, exactly the way
// the reader would, which is the whole point of the sandbox: it exercises the
// production render path, not a bespoke preview.

import type { ArgType, ArgTypes, ControlType, Story } from "@ladle/react";

import {
	INLINE_TAG_MANIFEST,
	INLINE_TAG_PROPS,
	type PropSchema,
	type PropType,
} from "chogui";

import { StoryMarkup } from "./_story-markup";

// Map a declared prop type to the closest Ladle control.
const CONTROL_BY_TYPE: Record<PropType, ControlType> = {
	string: "text",
	number: "number",
	boolean: "boolean",
	enum: "select",
};

function defaultFor(type: PropType, options?: readonly string[]): unknown {
	switch (type) {
		case "number":
			return 0;
		case "boolean":
			return false;
		case "enum":
			return options?.[0] ?? "";
		default:
			return "";
	}
}

/** Derive Ladle `argTypes` from a tag's declared prop schema. */
export function argTypesFromSchema(schema: PropSchema): ArgTypes {
	const out: ArgTypes = {};
	for (const [name, descriptor] of Object.entries(schema)) {
		const argType: ArgType = {
			control: { type: CONTROL_BY_TYPE[descriptor.type] },
			description: descriptor.description,
			defaultValue: descriptor.default ?? defaultFor(descriptor.type, descriptor.enum),
		};
		if (descriptor.type === "enum") argType.options = descriptor.enum ?? [];
		out[name] = argType;
	}
	return out;
}

// Render the authored attribute list for the keys a schema declares, skipping
// empty values so an unset control simply omits the attribute (the reader's
// coercion then applies the descriptor default).
function authorAttribs(args: Record<string, unknown>, schema: PropSchema | undefined): string {
	if (!schema) return "";
	const parts = Object.keys(schema)
		.map((key) => [key, args[key]] as const)
		.filter(([, value]) => value !== undefined && value !== null && value !== "")
		.map(([key, value]) => `${key}="${String(value)}"`);
	return parts.length ? ` ${parts.join(" ")}` : "";
}

/** The live render + the author syntax that produced it, side by side. */
export function TagPreview({
	source,
	observed,
}: {
	source: string;
	observed?: Record<string, unknown>;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="leading-relaxed">
				<StoryMarkup
					source={source}
					runtime={{
						observedVars: observed,
						onSelectChoice: (id) => console.info(`[link] selected choice ${id}`),
					}}
				/>
			</div>
			<pre className="overflow-x-auto rounded-md border border-base-content/10 bg-base-200/60 px-3 py-2 text-xs text-base-content/55">
				{source}
			</pre>
		</div>
	);
}

/**
 * Build a Ladle story for a single registered tag. Controls come from the tag's
 * manifest prop schema; paired tags additionally expose a `content` text control
 * for their inner children. The returned function renders the assembled author
 * syntax through `StoryMarkup`.
 */
export function makeTagStory(
	name: string,
	opts: {
		content?: string;
		observed?: Record<string, unknown>;
		/** Override the derived control default for specific attributes. */
		argDefaults?: Record<string, unknown>;
	} = {},
): Story {
	const schema = INLINE_TAG_PROPS[name] as PropSchema | undefined;
	const kind = INLINE_TAG_MANIFEST.find((entry) => entry.name === name)?.kind ?? "paired";
	const paired = kind === "paired";

	const component: Story = (args: Record<string, unknown>) => {
		const attribs = authorAttribs(args, schema);
		const content = (args.content as string | undefined) ?? opts.content ?? "";
		const source = paired
			? `[${name}${attribs}]${content}[/${name}]`
			: `[${name}${attribs}]`;
		return <TagPreview source={source} observed={opts.observed} />;
	};

	const argTypes: ArgTypes = { ...(schema ? argTypesFromSchema(schema) : {}) };
	if (paired) {
		argTypes.content = {
			control: { type: "text" },
			defaultValue: opts.content ?? "Example text",
			description: "Inner content the tag wraps.",
		};
	}
	for (const [key, value] of Object.entries(opts.argDefaults ?? {})) {
		if (argTypes[key]) argTypes[key] = { ...argTypes[key], defaultValue: value };
	}
	component.argTypes = argTypes;
	return component;
}
