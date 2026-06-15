// DaisyUI motion pack (Wave 3): text-rotate, hover-gallery, countdown.
//
// - `text-rotate` is a FLAT plain-text list: its rotating phrases are the
//   newline-separated lines of its content (no per-item child tag). CSS-only —
//   DaisyUI ships the cycling animation.
// - `hover-gallery` wraps reused `[img]` children (already bare `<img>`, which is
//   what `.hover-gallery > img` targets). A tiny co-located style resets `[img]`'s
//   own margins so the stacked-column layout isn't offset.
// - `countdown` is dual-mode (see ../markup/Countdown): static `--value` by
//   default, opt-in ticking island via `tick`/`from`.

import type { ReactNode } from "react";

import type { InlineTagDefinition } from "../contract";
import { countdownProps } from "../manifest";
import { Countdown } from "../markup/Countdown";

// Reset `[img]`'s default margins inside the gallery so the stacked columns
// line up. Namespaced under `choui-hover-gallery` so it can't affect other use.
const HOVER_GALLERY_STYLES = `.choui-hover-gallery > img{margin:0}`;

// Pull the plain-text content out of already-parsed children. text-rotate's
// content is authored as plain lines, so children resolve to a string (or an
// array of strings); we ignore any element nodes.
function textOf(node: ReactNode): string {
	if (typeof node === "string") return node;
	if (typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join("");
	return "";
}

function TextRotate({ children }: { children: ReactNode }) {
	const raw = textOf(children);
	const lines = raw
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);
	// Degrade gracefully: if no newlines survived, rotate the single phrase
	// (renders it without cycling rather than breaking).
	const items = lines.length > 0 ? lines : [raw.trim()].filter(Boolean);
	if (items.length === 0) return null;
	return (
		<span className="text-rotate">
			<span>
				{items.map((line, i) => (
					<span key={i}>{line}</span>
				))}
			</span>
		</span>
	);
}

function HoverGallery({ children }: { children: ReactNode }) {
	return <figure className="hover-gallery choui-hover-gallery max-w-sm my-4">{children}</figure>;
}

export const daisyMotionPack: InlineTagDefinition[] = [
	{
		name: "text-rotate",
		kind: "paired",
		render: ({ children }) => <TextRotate>{children}</TextRotate>,
	},
	{
		name: "hover-gallery",
		kind: "paired",
		styles: HOVER_GALLERY_STYLES,
		render: ({ children }) => <HoverGallery>{children}</HoverGallery>,
	},
	{
		name: "countdown",
		kind: "void",
		props: countdownProps,
		render: ({ props, runtime }) => (
			<Countdown
				value={props?.value as string | undefined}
				max={props?.max as number | undefined}
				digits={props?.digits as number | undefined}
				variant={props?.variant as string | undefined}
				tick={props?.tick as boolean | undefined}
				from={props?.from as number | undefined}
				observed={runtime?.observedVars}
			/>
		),
	},
];
