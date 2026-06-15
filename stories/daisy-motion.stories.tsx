// Ladle stories for the DaisyUI motion pack (Wave 3): text-rotate,
// hover-gallery, countdown.
//
// `text-rotate` content is newline-separated phrases; `countdown` static mode
// uses `makeTagStory` controls. The ticking countdown and the image gallery are
// hand-authored.

import type { Story } from "@ladle/react";

import { makeTagStory, TagPreview } from "./_sandbox";

export default {
	title: "Components",
};

// Rotating phrases are the newline-separated lines of the content.
export const TextRotate = makeTagStory("text-rotate", {
	content: "BLAZING\nFAST\nFURIOUS",
});

export const HoverGallery: Story = () => (
	<TagPreview
		source={[
			`[hover-gallery]`,
			`[img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400" alt="forest"]`,
			`[img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400" alt="mountains"]`,
			`[img src="https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400" alt="field"]`,
			`[/hover-gallery]`,
		].join("\n")}
	/>
);

// Static mode: a styled number, optionally bound to an observed var.
export const Countdown = makeTagStory("countdown", {
	observed: { fuse: 42 },
	argDefaults: { value: "{fuse}", digits: 2 },
});

// Ticking mode: counts down once from `from` to 0 on mount.
export const CountdownTicking: Story = () => (
	<TagPreview source={`[countdown tick="true" from="10" digits="2"]`} />
);
