// Ladle stories for the enabled inline tags (core built-ins + the `kbd` sample).
//
// Every story renders AUTHOR SYNTAX (`[tag]…[/tag]`) through the real
// `StoryMarkup`, and its controls are derived from the tag's declared `props`
// schema via `makeTagStory` (see ./_sandbox). Adding a tag to the manifest with
// a schema therefore gives it controls here for free — nothing is hand-authored.
//
// Runtime (scene-processor) tags such as `# fx` are deliberately ABSENT: they
// have no inline UI of their own (they set bridge directives like `className`
// on a scene), so they are reader behaviors, not stories. The sandbox renders
// `StoryMarkup` in isolation for fast iteration; since `wire-story-markup-into-
// reader`, the live reader renders prose through the same `StoryMarkup`, so a
// tag shown here also renders in the reader.

import { makeTagStory } from "./_sandbox";

export default {
	title: "Components",
};

export const Highlight = makeTagStory("highlight", { content: "a silver key" });
export const Info = makeTagStory("info", {
	content: "The codex notes this is an heirloom.",
});
export const Banner = makeTagStory("banner", { content: "Chapter One" });
export const Spoiler = makeTagStory("spoiler", { content: "she was the culprit" });
export const Divider = makeTagStory("divider");
export const Block = makeTagStory("block", {
	content: "A constrained passage that never spans the full measure.",
	argDefaults: { width: "60%" },
});
export const Link = makeTagStory("link", {
	content: "turn back",
	argDefaults: { choice: 0 },
});
export const Progress = makeTagStory("progress", {
	observed: { hp: 60 },
	argDefaults: { value: "{hp}", max: 100 },
});
export const Picture = makeTagStory("picture", {
	argDefaults: {
		src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900",
		alt: "A forest at dawn",
		caption: "At dusk the trees went quiet.",
		variation: "full-bleed",
	},
});
export const Img = makeTagStory("img", {
	argDefaults: {
		src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
		alt: "A forest",
	},
});

// Sample community inline pack — proves the contributor PR path renders here too.
export const Kbd = makeTagStory("kbd", { content: "Ctrl" });
