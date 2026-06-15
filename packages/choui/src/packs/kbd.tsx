// Sample community tag pack: `[kbd]…[/kbd]` renders a keyboard-key glyph.
//
// This file exists to prove the contributor PR path: it is authored *only*
// against the package's React-free public surface — the tag contract
// (`../contract`) and its declared prop schema (`../manifest`). It imports no
// reader internals (no markup components, no narrator, no registry plumbing). A
// community contributor writes exactly this much, opens a PR against the curated
// `wondo-app/story-tags` repo, and an operator enables it by bundling the pack
// at build time (registering it in the bootstrap; the manifest entry carries it
// into the validator's enabled set). The render is plain JSX, so the contract +
// schema alone are enough to ship a tag with explorable, validated props.

import type { InlineTagDefinition } from "../contract";
import { kbdProps } from "../manifest";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const SIZE_CLASS: Record<string, string> = {
	xs: "kbd-xs",
	sm: "kbd-sm",
	md: "kbd-md",
	lg: "kbd-lg",
	xl: "kbd-xl",
};

export const kbdPack: InlineTagDefinition[] = [
	{
		name: "kbd",
		kind: "paired",
		props: kbdProps,
		render: ({ props, children }) => {
			const size = (props?.size as string | undefined) ?? "sm";
			return <kbd className={`kbd ${SIZE_CLASS[size] ?? SIZE_CLASS.sm}`}>{children}</kbd>;
		},
	},
];
