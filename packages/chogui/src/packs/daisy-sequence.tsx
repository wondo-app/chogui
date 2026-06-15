// DaisyUI sequence pack (Wave 2): breadcrumbs, steps/step, timeline/event,
// carousel. These render ordered/sequential structures.
//
// Composition shapes per the library's conventions:
//   - `breadcrumbs` is a FLAT plain-text list, so it takes a comma-delimited
//     `items` prop — no per-item child tag.
//   - `steps`/`step`, `timeline`/`event` carry per-item config or rich/nested
//     content, so they are matched parent+child tag-sets (child-agnostic: a
//     parent renders `{children}` without inspecting them).
//   - `carousel` auto-wraps each top-level child as one slide (an element → a
//     `carousel-item`; bare text → one slide per non-empty line), so there is no
//     per-slide tag. A multi-element slide is composed with the reusable
//     `[group]` flex primitive (shipped by ./daisy-display), which the carousel
//     wraps as a single child.
//
// `timeline` ships a tiny static CSS (via the definition's `styles` field) that
// hides the leading `<hr>` on the first event and the trailing `<hr>` on the
// last — because each `event` renders independently and can't know its position,
// it emits both connectors and the CSS trims the outer two. Scoped under the
// `chogui-timeline` namespace class so it can't clobber other `.timeline` use.

import { Children, type ReactNode } from "react";

import type { InlineTagDefinition } from "../contract";
import {
	breadcrumbsProps,
	carouselProps,
	eventProps,
	stepProps,
	stepsProps,
	timelineProps,
} from "../manifest";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const STEPS_DIRECTION: Record<string, string> = {
	horizontal: "steps-horizontal",
	vertical: "steps-vertical",
};
const STEP_COLOR: Record<string, string> = {
	primary: "step-primary",
	info: "step-info",
	success: "step-success",
	warning: "step-warning",
	error: "step-error",
	neutral: "step-neutral",
};
const TIMELINE_DIRECTION: Record<string, string> = {
	vertical: "timeline-vertical",
	horizontal: "timeline-horizontal",
};
const CAROUSEL_SNAP: Record<string, string> = {
	start: "carousel-start",
	center: "carousel-center",
	end: "carousel-end",
};

// Static, namespaced under `chogui-timeline` so it can't affect other timelines.
const TIMELINE_STYLES = `.chogui-timeline > li:first-child > hr:first-child{display:none}.chogui-timeline > li:last-child > hr:last-child{display:none}`;

function Breadcrumbs({ items }: { items?: string }) {
	const labels = (items ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (labels.length === 0) return null;
	return (
		<div className="breadcrumbs text-sm my-3">
			<ul>
				{labels.map((label, i) => (
					<li key={i}>{label}</li>
				))}
			</ul>
		</div>
	);
}

function Steps({ direction = "horizontal", children }: { direction?: string; children: ReactNode }) {
	const directionClass = STEPS_DIRECTION[direction] ?? STEPS_DIRECTION.horizontal;
	return <ul className={`steps ${directionClass} my-4`}>{children}</ul>;
}

function Step({ variant, children }: { variant?: string; children: ReactNode }) {
	const colorClass = variant ? (STEP_COLOR[variant] ?? "") : "";
	return <li className={`step ${colorClass}`}>{children}</li>;
}

function Timeline({ direction = "vertical", children }: { direction?: string; children: ReactNode }) {
	const directionClass = TIMELINE_DIRECTION[direction] ?? TIMELINE_DIRECTION.vertical;
	return <ul className={`timeline chogui-timeline ${directionClass} my-4`}>{children}</ul>;
}

function Event({
	time,
	icon,
	children,
}: {
	time?: string;
	icon?: string;
	children: ReactNode;
}) {
	return (
		<li>
			<hr />
			{time ? <div className="timeline-start text-sm opacity-70">{time}</div> : null}
			<div className="timeline-middle">
				{icon ? (
					<span aria-hidden="true">{icon}</span>
				) : (
					<span className="block h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
				)}
			</div>
			<div className="timeline-end timeline-box">{children}</div>
			<hr />
		</li>
	);
}

function Carousel({ snap = "start", children }: { snap?: string; children: ReactNode }) {
	const snapClass = CAROUSEL_SNAP[snap] ?? CAROUSEL_SNAP.start;
	// Auto-wrap each top-level child as one slide: an element becomes a
	// `carousel-item`; a bare text node contributes one slide per non-empty line.
	// Whitespace-only text between tags drops out. A multi-element slide is a
	// single `[group]` child (itself an element), so it wraps as one slide.
	const slides: ReactNode[] = [];
	Children.toArray(children).forEach((child, idx) => {
		if (typeof child === "string") {
			child
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean)
				.forEach((line, i) => {
					slides.push(
						<div className="carousel-item" key={`t-${idx}-${i}`}>
							{line}
						</div>,
					);
				});
			return;
		}
		slides.push(
			<div className="carousel-item" key={`e-${idx}`}>
				{child}
			</div>,
		);
	});
	return (
		<div className={`carousel rounded-box ${snapClass} my-4 max-w-full gap-4`}>{slides}</div>
	);
}

export const daisySequencePack: InlineTagDefinition[] = [
	{
		name: "breadcrumbs",
		kind: "void",
		props: breadcrumbsProps,
		render: ({ props }) => <Breadcrumbs items={props?.items as string | undefined} />,
	},
	{
		name: "steps",
		kind: "paired",
		props: stepsProps,
		render: ({ props, children }) => (
			<Steps direction={props?.direction as string | undefined}>{children}</Steps>
		),
	},
	{
		name: "step",
		kind: "paired",
		props: stepProps,
		render: ({ props, children }) => (
			<Step variant={props?.variant as string | undefined}>{children}</Step>
		),
	},
	{
		name: "timeline",
		kind: "paired",
		props: timelineProps,
		styles: TIMELINE_STYLES,
		render: ({ props, children }) => (
			<Timeline direction={props?.direction as string | undefined}>{children}</Timeline>
		),
	},
	{
		name: "event",
		kind: "paired",
		props: eventProps,
		render: ({ props, children }) => (
			<Event
				time={props?.time as string | undefined}
				icon={props?.icon as string | undefined}
			>
				{children}
			</Event>
		),
	},
	{
		name: "carousel",
		kind: "paired",
		props: carouselProps,
		render: ({ props, children }) => (
			<Carousel snap={props?.snap as string | undefined}>{children}</Carousel>
		),
	},
];
