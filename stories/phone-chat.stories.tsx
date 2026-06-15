// Ladle stories for the phone-chat coordinating tag-set — the reference example
// for tags that cooperate across slots (chat container + message bubbles).
//
// The conversation is authored exactly as a writer would type it, and rendered
// through the real `StoryMarkup`. The `self` / `title` controls are derived from
// `[chat]`'s declared schema; flipping `self` live re-aligns every bubble,
// demonstrating the React-context coordination (see packs/phone-chat.tsx): a
// bubble whose `from` equals the chat's `self` is a sent message (right), any
// other is received (left, labeled).

import type { Story } from "@ladle/react";

import { INLINE_TAG_PROPS } from "chogui";

import { argTypesFromSchema, makeTagStory, TagPreview } from "./_sandbox";

export default {
	title: "Components",
};

const CONVERSATION = [
	`[bubble from="alex"]Are you near the old pier?[/bubble]`,
	`[bubble from="me"]Just got here. It's quiet.[/bubble]`,
	`[bubble from="alex"]Good. Wait for my signal.[/bubble]`,
	`[bubble from="me"]Understood.[/bubble]`,
];

// The full worked example: a coordinating chat with sent/received bubbles.
// `self` decides which bubbles align right.
export const Conversation: Story = (args: Record<string, unknown>) => {
	const self = (args.self as string | undefined) ?? "me";
	const title = (args.title as string | undefined) ?? "Alex Rivera";
	const source = [`[chat self="${self}" title="${title}"]`, ...CONVERSATION, `[/chat]`].join(
		"\n",
	);
	return <TagPreview source={source} />;
};

const conversationArgTypes = argTypesFromSchema(INLINE_TAG_PROPS["chat"]);
conversationArgTypes.self = { ...conversationArgTypes.self, defaultValue: "me" };
conversationArgTypes.title = { ...conversationArgTypes.title, defaultValue: "Alex Rivera" };
Conversation.argTypes = conversationArgTypes;

// Graceful degradation: a `[bubble]` outside any `[chat]` reads a null context
// and falls back to the received (left, labeled) treatment — nothing throws.
export const LoneBubbleDegrades: Story = () => (
	<TagPreview source={`[bubble from="alex"]Anyone there?[/bubble]`} />
);

// A single bubble with its `tone` control exposed, so every DaisyUI bubble color
// is explorable. Outside a `[chat]` it renders as a received bubble; an explicit
// `tone` overrides the color regardless of sent/received.
export const BubbleTone = makeTagStory("bubble", {
	content: "Pick a tone from the controls.",
	argDefaults: { from: "alex" },
});
