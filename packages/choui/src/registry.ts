// In-memory inline-tag registry.
//
// There is no runtime discovery: the registry is populated by explicit
// `registerInlineTag` calls at island bootstrap (see ./index.ts for the core
// pack). Names are lowercased; a later registration overwrites an earlier one,
// so a community pack imported after the core pack can override a core tag.

import type { InlineTagDefinition } from "./contract";
import { registerTagStyles } from "./styles";

const registry = new Map<string, InlineTagDefinition>();

export function registerInlineTag(definition: InlineTagDefinition): void {
	const name = definition.name.toLowerCase();
	registry.set(name, { ...definition, name });
	// A pack that ships CSS declares it on the definition; forward it to the
	// style registry so the reader injects it once (keyed by tag name).
	if (definition.styles) registerTagStyles(name, definition.styles);
}

export function registerInlineTags(definitions: InlineTagDefinition[]): void {
	for (const definition of definitions) registerInlineTag(definition);
}

export function getInlineTag(name: string): InlineTagDefinition | undefined {
	return registry.get(name.toLowerCase());
}

export function getInlineTagNames(): string[] {
	return [...registry.keys()];
}

export function hasInlineTag(name: string): boolean {
	return registry.has(name.toLowerCase());
}
