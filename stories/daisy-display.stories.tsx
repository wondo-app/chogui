// Ladle stories for the DaisyUI display pack (Wave 1): card, tooltip,
// radial-progress, stats/stat, window-mockup.
//
// Every story renders AUTHOR SYNTAX (`[tag]…[/tag]`) through the real
// `StoryMarkup`; scalar-prop tags use `makeTagStory` (controls derived from the
// manifest schema). `stats` is compound (one `[stat]` per cell), so it is
// hand-authored — the nested child markup is the story's content.

import type { Story } from "@ladle/react";

import { makeTagStory, TagPreview } from "./_sandbox";

export default {
	title: "Components",
};

export const Card = makeTagStory("card", {
	content: "A worn leather journal, its clasp long since broken.",
	argDefaults: { title: "The Journal", variant: "border", size: "md" },
});

export const Tooltip = makeTagStory("tooltip", {
	content: "the Silver Order",
	argDefaults: { tip: "A guild of cartographers.", placement: "top" },
});

export const RadialProgress = makeTagStory("radial-progress", {
	observed: { hp: 70 },
	argDefaults: { value: "{hp}", max: 100, variant: "primary", size: "5rem" },
});

export const WindowMockup = makeTagStory("window-mockup", {
	content: "C:\\> run adventure.exe",
});

// Compound: a `[stats]` row with three `[stat]` cells.
export const Stats: Story = () => (
	<TagPreview
		source={[
			`[stats]`,
			`[stat title="Chapters" value="12" desc="of 20"]`,
			`[stat title="Endings found" value="3" desc="of 7"]`,
			`[stat title="Gold" value="248" desc="+30 today"]`,
			`[/stats]`,
		].join("\n")}
	/>
);

// The flex layout primitive: lay two images side by side via `[group]`.
export const Group = makeTagStory("group", {
	content: `[img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300" alt="forest"][img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300" alt="mountains"]`,
	argDefaults: { direction: "horizontal", gap: "md" },
});
