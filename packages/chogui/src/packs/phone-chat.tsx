// Sample coordinating tag-set: a phone-chat conversation built from two
// inline tags that cooperate across slots.
//
//   [chat self="me" title="Alex"]
//     [bubble from="alex"]Hey, you around?[/bubble]
//     [bubble from="me"]Just got back.[/bubble]
//   [/chat]
//
// This is the reference *coordinating* pattern (contrast the child-agnostic
// primitives in ./builtins, which never inspect their context). The
// coordination is carried by a React context, NOT by parent→child inspection:
//
//   - `[chat]` is the provider. It renders the phone frame + header and a
//     `ChatContext.Provider` carrying `self` (the author's "own" speaker id).
//   - `[bubble]` is the consumer. It reads `self` from context and compares it
//     to its own `from`: a match aligns the bubble right (a sent message, no
//     label); a mismatch aligns left and shows the sender label.
//
// The bubbles use DaisyUI's `chat` component (`chat` + `chat-start`/`chat-end`,
// `chat-header`, `chat-bubble` (+ `chat-bubble-primary` for self, or an explicit
// `tone` color)); the header
// avatar is a DaisyUI `avatar avatar-placeholder`. Both inherit the `wondo`
// theme, so the pack ships no CSS of its own — the only hand-rolled element is
// the lightweight phone frame that wraps the conversation. This is the text
// exchange only; there is deliberately no message-input/send composer.
//
// Why context and not "the parent reads its children": StoryMarkup dispatches
// each tag independently and recurses into children via `domToReact`, so a
// parent never receives a typed list of its children to inspect. Context is the
// composition-safe channel — it flows down the rendered React tree regardless of
// how the parser nested the custom elements. Each member also degrades when used
// alone: a `[bubble]` with no surrounding `[chat]` reads a null context and
// falls back to the received (left) treatment, so nothing throws.
//
// The context is read inside real components (`Bubble`) rather than in the
// definition's `render` callback, because `render` runs during StoryMarkup's
// own render pass (before the provider is mounted). Returning a component
// element defers the `useContext` call to React's reconciler, where the
// provider is correctly positioned above the consumer.

import { createContext, useContext, type ReactNode } from "react";

import type { InlineTagDefinition } from "../contract";
import { bubbleProps, chatProps } from "../manifest";

interface ChatContextValue {
	/** The speaker id the author treats as "self" (sent, right-aligned). */
	self: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const TONE_CLASS: Record<string, string> = {
	primary: "chat-bubble-primary",
	info: "chat-bubble-info",
	success: "chat-bubble-success",
	warning: "chat-bubble-warning",
	error: "chat-bubble-error",
	neutral: "chat-bubble-neutral",
};

function initials(title: string): string {
	const trimmed = title.trim();
	if (!trimmed) return "·";
	return trimmed
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? "")
		.join("");
}

function ChatFrame({
	self,
	title,
	children,
}: {
	self: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<ChatContext.Provider value={{ self }}>
			<div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border border-base-content/15 bg-base-100 shadow-sm">
				{title ? (
					<header className="flex items-center gap-2 border-b border-base-content/10 bg-base-200/60 px-4 py-3">
						<div className="avatar avatar-placeholder">
							<div className="w-7 rounded-full bg-neutral text-neutral-content">
								<span className="text-xs font-semibold">{initials(title)}</span>
							</div>
						</div>
						<span className="text-sm font-medium text-base-content">{title}</span>
					</header>
				) : null}
				<div className="flex flex-col px-3 py-4">{children}</div>
			</div>
		</ChatContext.Provider>
	);
}

function Bubble({
	from,
	tone = "auto",
	children,
}: {
	from: string;
	tone?: string;
	children: ReactNode;
}) {
	const ctx = useContext(ChatContext);
	const isSelf = ctx !== null && from.length > 0 && from === ctx.self;
	// `auto` keeps the sent/received default (sent = primary); an explicit tone
	// overrides for either side.
	const color = tone === "auto" ? (isSelf ? TONE_CLASS.primary : "") : (TONE_CLASS[tone] ?? "");
	return (
		<div className={`chat ${isSelf ? "chat-end" : "chat-start"}`}>
			{!isSelf && from ? (
				<div className="chat-header text-base-content/50">{from}</div>
			) : null}
			<div className={`chat-bubble ${color}`}>{children}</div>
		</div>
	);
}

export const phoneChatPack: InlineTagDefinition[] = [
	{
		name: "chat",
		kind: "paired",
		props: chatProps,
		render: ({ props, children }) => (
			<ChatFrame
				self={(props?.self as string | undefined) ?? ""}
				title={(props?.title as string | undefined) ?? ""}
			>
				{children}
			</ChatFrame>
		),
	},
	{
		name: "bubble",
		kind: "paired",
		props: bubbleProps,
		render: ({ props, children }) => (
			<Bubble
				from={(props?.from as string | undefined) ?? ""}
				tone={(props?.tone as string | undefined) ?? "auto"}
			>
				{children}
			</Bubble>
		),
	},
];
