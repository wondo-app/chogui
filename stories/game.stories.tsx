// Ladle stories for the game-fiction pack: icon, dice, board, spintop.
//
// `icon` is a curated lucide glyph. `dice` is the read-only VISUALIZER of a value
// decided in Ink: it reads `value` (a literal or observed `{var}`; a comma-list
// for multiple dice) and tumbles the dice to those faces. In the sandbox there's
// no live runtime, so the controls pass a literal `value`.
//
// (The exported `DiceRoller` building block — self-rolling for theme tuning — is
// catalogued under "Patterns" as an extension example, not here: it is not an
// author tag.)

import { makeTagStory } from "./_sandbox";

export default {
	title: "Components",
};

export const Icon = makeTagStory("icon", {
	argDefaults: { name: "heart", size: "md", variant: "error" },
});

// The `dice` tag — geometry (`notation`), the Ink-decided face value(s) (`value`,
// a literal or `{var}`; comma-list for multiple dice), and the view props, via
// schema controls. Default `reveal="auto"` tumbles on mount; `click` defers it.
export const Dice = makeTagStory("dice", {
	argDefaults: {
		notation: "d20",
		value: "13",
		size: "md",
		color: "bone",
		texture: "none",
		pips: "auto",
		sound: false,
		reveal: "auto",
	},
});

// The `board` tag — a choice board where the piece moves to one of N cells (the
// coin GLB reused as the piece). Sandbox uses `labels`/`value`; the live reader will
// read the branch choices and route selection through `onSelectChoice` (Phase B).
export const Board = makeTagStory("board", {
	argDefaults: {
		labels: "North, East, South, West",
		layout: "ring",
		size: "md",
		piece: "skittle",
		color: "bone",
		texture: "none",
	},
});

// The `spintop` tag — an N-sided teetotum driven by the cannon-es solver: thrown
// spinning, it topples and tumbles for flavor. Faces show the `actions` text (or
// numbers); `color`/`texture` match the dice colorsets.
export const SpinTop = makeTagStory("spintop", {
	argDefaults: {
		actions: "T1, P2, TT, TP",
		value: "0",
		size: "md",
		color: "bone",
		texture: "none",
		sound: false,
	},
});
