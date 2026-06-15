// Ladle "Patterns" gallery — usage examples that aren't single author tags, as
// opposed to the per-tag entries under "Components". Two kinds live here:
//
//   1. Tag compositions — a named scene (an item pickup, a dialogue exchange, a
//      quest log) built only from already-shipped tags, rendered through the real
//      `StoryMarkup` via `TagPreview` — exactly the author syntax a writer types.
//      These add no new tag, prop, or mechanism.
//   2. Extension examples — how to build ON the package's exported building blocks
//      (e.g. the `DiceRoller` view) rather than only via `[tag]` markup.
//
// Conceptual lineage: game-UI references like gameuidatabase.com and
// interfaceingame.com.

import type { Story } from "@ladle/react";

import { DiceRoller } from "choui";

import { TagPreview } from "./_sandbox";

export default {
	title: "Patterns",
};

// Take item — an "item acquired" card: image + highlighted name + a stats block.
export const TakeItem: Story = () => (
	<TagPreview
		source={[
			`[card title="Item acquired"]`,
			`[img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400" alt="The clearing at dusk"]`,
			`You found a [highlight]Silver Key[/highlight] half-buried in the moss — its teeth worn smooth, as if turned a thousand times.`,
			`[stats]`,
			`[stat title="Weight" value="0.1" desc="lb"]`,
			`[stat title="Worth" value="120" desc="gold"]`,
			`[/stats]`,
			`[/card]`,
		].join("\n")}
	/>
);

// Dialogue — a chat exchange: bubbles align by `from` vs. the chat's `self`; a
// `tone` override colors the beat that turns.
export const Dialogue: Story = () => (
	<TagPreview
		source={[
			`[chat self="me" title="Eli Vance"]`,
			`[bubble from="eli"]You made it to the ridge?[/bubble]`,
			`[bubble from="me"]Barely. The bridge is out.[/bubble]`,
			`[bubble from="eli"]Then go around — the mill road. Longer, but it's clear.[/bubble]`,
			`[bubble from="me"]Understood. Moving now.[/bubble]`,
			`[bubble from="eli" tone="warning"]Wait — you're not alone up there.[/bubble]`,
			`[/chat]`,
		].join("\n")}
	/>
);

// Quest log — a titled card wrapping ordered objectives: done (success), current
// (primary), and pending (default) steps.
export const QuestLog: Story = () => (
	<TagPreview
		source={[
			`[card title="The Drowned Bell — Objectives"]`,
			`[steps]`,
			`[step variant="success"]Reach the harbor[/step]`,
			`[step variant="success"]Find the bell-keeper[/step]`,
			`[step variant="primary"]Recover the bell's clapper[/step]`,
			`[step]Ring the bell at midnight[/step]`,
			`[/steps]`,
			`[/card]`,
		].join("\n")}
	/>
);

// Grouped carousel — a composite slide: `[group]` lays out an image + caption as
// one carousel item, beside a bare-image slide.
export const GroupedCarousel: Story = () => (
	<TagPreview
		source={[
			`[carousel]`,
			`[group][img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400" alt="forest"]The old wood.[/group]`,
			`[img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400" alt="mountains"]`,
			`[/carousel]`,
		].join("\n")}
	/>
);

// EXTENSION EXAMPLE (not a tag). The package exports the `DiceRoller` view (plus
// `rollNotation` / `predeterminedNotationFor`) as building blocks. Here it runs
// in self-roll mode — generating its own face on each click — purely as a
// theme/size/texture tuning sandbox. NOTE: the shipped `[dice]` tag never does
// this; it only *visualizes* an Ink-decided value (Ink owns the randomness so
// branches replay faithfully). This view writes no variable; the self-roll is a
// Ladle tuning convenience, not a product pattern.
const TEXTURE_OPTIONS = [
	"none",
	"paper",
	"marble",
	"speckles",
	"stone",
	"wood",
	"metal",
	"glitter",
	"stars",
	"astral",
	"water",
	"ice",
	"fire",
	"cloudy",
	"dragon",
	"leopard",
	"skulls",
];

type DiceTuningArgs = {
	notation: string;
	size: string;
	color: string;
	texture: string;
	sound: boolean;
};

export const DiceViewTuning = ({ notation, size, color, texture, sound }: DiceTuningArgs) => (
	<div className="p-4">
		<DiceRoller
			notation={notation}
			size={size}
			color={color}
			texture={texture}
			sound={sound}
			once={false}
		/>
	</div>
);

DiceViewTuning.args = {
	notation: "2d6+3",
	size: "md",
	color: "bone",
	texture: "none",
	sound: false,
};

DiceViewTuning.argTypes = {
	size: { options: ["sm", "md", "lg"], control: { type: "select" } },
	color: {
		options: ["bone", "ink", "sage", "amber", "coral", "sky"],
		control: { type: "select" },
	},
	texture: { options: TEXTURE_OPTIONS, control: { type: "select" } },
	sound: { control: { type: "boolean" } },
};
