// Game-fiction pack: icon, dice, board, spintop.
//
// `icon` is a curated lucide glyph (display-only). `dice` is the read-only VISUALIZER of
// a value decided in Ink: it resolves `value` (a literal or observed `{var}`; a comma-list
// for multiple dice) and tumbles the dice to those faces. It generates no randomness and
// writes no variable — Ink owns the roll (`RANDOM` / the `random.ink` stdlib), so
// branch-driving randomness stays replay-safe. `spintop` is a decorative teetotum;
// `board` maps the branch choices to cells. The player's agency comes from an Ink choice,
// not from a tag.

import type { InlineTagDefinition } from "../contract";
import { boardProps, diceProps, iconProps, spintopProps } from "../manifest";
import { BoardMover } from "../markup/BoardMover";
import { DiceRoller } from "../markup/DiceRoller";
import { Icon } from "../markup/Icon";
import { resolveValues } from "../markup/resolve-value";
import { SpinTop } from "../markup/SpinTop";

export const gamePack: InlineTagDefinition[] = [
	{
		name: "icon",
		kind: "void",
		props: iconProps,
		render: ({ props }) => (
			<Icon
				name={props?.name as string | undefined}
				size={props?.size as string | undefined}
				variant={props?.variant as string | undefined}
			/>
		),
	},
	{
		name: "dice",
		kind: "void",
		props: diceProps,
		render: ({ props, runtime }) => (
			<DiceRoller
				notation={(props?.notation as string | undefined) ?? "d6"}
				values={resolveValues(props?.value as string | undefined, runtime?.observedVars)}
				reveal={props?.reveal as "auto" | "click" | undefined}
				size={props?.size as string | undefined}
				color={props?.color as string | undefined}
				texture={props?.texture as string | undefined}
				pips={props?.pips as string | undefined}
				sound={props?.sound as boolean | undefined}
				shadow={props?.shadow as boolean | undefined}
			/>
		),
	},
	{
		name: "board",
		kind: "void",
		props: boardProps,
		render: ({ props, runtime }) => {
			// Live reader: labels come from choice text, selecting calls onSelectChoice.
			// Per the contract, an empty `choices` array means a live runtime with no
			// pending choices — treated like the sandbox: authored labels/value props.
			// Labels are passed as an array so the index↔choice mapping survives
			// commas (or anything else) in choice text.
			const choices = runtime?.choices?.length ? runtime.choices : undefined;
			return (
				<BoardMover
					labels={choices ? choices.map((c) => c.label) : (props?.labels as string | undefined) ?? ""}
					value={choices ? undefined : (props?.value as string | undefined)}
					layout={props?.layout as "ring" | "half" | "track" | "grid" | undefined}
					size={props?.size as string | undefined}
					color={props?.color as string | undefined}
					texture={props?.texture as string | undefined}
					piece={props?.piece as string | undefined}
					sound={props?.sound as boolean | undefined}
					shadow={props?.shadow as boolean | undefined}
					observedVars={runtime?.observedVars}
					onSelect={
						choices
							? (i) => {
									const choice = choices[i];
									if (choice) runtime?.onSelectChoice?.(choice.id);
								}
							: undefined
					}
				/>
			);
		},
	},
	{
		name: "spintop",
		kind: "void",
		props: spintopProps,
		render: ({ props, runtime }) => (
			<SpinTop
				value={props?.value as string | undefined}
				varName={props?.var as string | undefined}
				actions={props?.actions as string | undefined}
				sides={props?.sides as number | undefined}
				size={props?.size as string | undefined}
				color={props?.color as string | undefined}
				texture={props?.texture as string | undefined}
				sound={props?.sound as boolean | undefined}
				shadow={props?.shadow as boolean | undefined}
				flavor={props?.flavor as boolean | undefined}
				observedVars={runtime?.observedVars}
				onSetVariable={runtime?.onSetVariable}
			/>
		),
	},
];
