// Ladle stories for the DaisyUI sequence pack (Wave 2): breadcrumbs, steps/step,
// timeline/event, carousel/slide.
//
// `breadcrumbs` is a flat list (comma-delimited `items`), so it uses
// `makeTagStory`. The matched tag-sets are hand-authored — the nested child
// markup is the story content, rendered through the real `StoryMarkup`.

import type { Story } from "@ladle/react";

import { makeTagStory, TagPreview } from "./_sandbox";

export default {
	title: "Components",
};

export const Breadcrumbs = makeTagStory("breadcrumbs", {
	argDefaults: { items: "Prologue, The Forest, The Tower" },
});

export const Steps: Story = () => (
	<TagPreview
		source={[
			`[steps]`,
			`[step variant="primary"]Wake[/step]`,
			`[step variant="primary"]Find the key[/step]`,
			`[step]Open the gate[/step]`,
			`[step]Escape[/step]`,
			`[/steps]`,
		].join("\n")}
	/>
);

export const Timeline: Story = () => (
	<TagPreview
		source={[
			`[timeline]`,
			`[event time="1893"]The lighthouse is built.[/event]`,
			`[event time="1921"]The keeper vanishes.[/event]`,
			`[event time="Today"]You arrive.[/event]`,
			`[/timeline]`,
		].join("\n")}
	/>
);

// Carousel auto-wraps each top-level child as a slide — bare `[img]` children
// need no per-slide tag.
export const Carousel: Story = () => (
	<TagPreview
		source={[
			`[carousel]`,
			`[img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400" alt="forest"]`,
			`[img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400" alt="mountains"]`,
			`[img src="https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400" alt="field"]`,
			`[/carousel]`,
		].join("\n")}
	/>
);
