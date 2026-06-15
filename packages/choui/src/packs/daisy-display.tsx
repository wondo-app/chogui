// DaisyUI display pack: card, tooltip, radial-progress, stats/stat,
// window-mockup, and the `group` flex layout primitive (0.6.0). These are
// child-agnostic primitives — they render `children`
// (or scalar props) without inspecting them, and compose/nest freely. Nested
// content (especially images) is authored as child tags inside the body, never
// as a prop; props carry scalar config only. Components are defined inline here
// (the pack precedent — see ./phone-chat) except `RadialProgress`, which reuses
// the `[progress]` value resolver and lives in ../markup.

import type { ReactNode } from "react";

import type { InlineTagDefinition } from "../contract";
import {
	cardProps,
	groupProps,
	radialProgressProps,
	statProps,
	statsProps,
	tooltipProps,
	windowMockupProps,
} from "../manifest";
import { RadialProgress } from "../markup/RadialProgress";

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const CARD_SIZE: Record<string, string> = {
	xs: "card-xs",
	sm: "card-sm",
	md: "card-md",
	lg: "card-lg",
	xl: "card-xl",
};
const CARD_VARIANT: Record<string, string> = {
	default: "",
	border: "card-border",
	side: "card-side",
};
const TOOLTIP_PLACEMENT: Record<string, string> = {
	top: "tooltip-top",
	bottom: "tooltip-bottom",
	left: "tooltip-left",
	right: "tooltip-right",
};
const TOOLTIP_COLOR: Record<string, string> = {
	primary: "tooltip-primary",
	info: "tooltip-info",
	success: "tooltip-success",
	warning: "tooltip-warning",
	error: "tooltip-error",
	neutral: "tooltip-neutral",
};
const STATS_DIRECTION: Record<string, string> = {
	horizontal: "stats-horizontal",
	vertical: "stats-vertical",
};
const GROUP_DIRECTION: Record<string, string> = {
	vertical: "flex-col",
	horizontal: "flex-row",
};
const GROUP_GAP: Record<string, string> = {
	none: "gap-0",
	sm: "gap-2",
	md: "gap-4",
	lg: "gap-6",
};
const GROUP_ALIGN: Record<string, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};
const GROUP_JUSTIFY: Record<string, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

function Card({
	title,
	variant = "default",
	size = "md",
	children,
}: {
	title?: string;
	variant?: string;
	size?: string;
	children: ReactNode;
}) {
	const sizeClass = CARD_SIZE[size] ?? CARD_SIZE.md;
	const variantClass = CARD_VARIANT[variant] ?? "";
	return (
		<div className={`card ${variantClass} ${sizeClass} bg-base-100 shadow-sm my-4`}>
			<div className="card-body">
				{title ? <h3 className="card-title">{title}</h3> : null}
				{children}
			</div>
		</div>
	);
}

function Tooltip({
	tip,
	placement = "top",
	variant,
	children,
}: {
	tip?: string;
	placement?: string;
	variant?: string;
	children: ReactNode;
}) {
	const placementClass = TOOLTIP_PLACEMENT[placement] ?? TOOLTIP_PLACEMENT.top;
	const colorClass = variant ? (TOOLTIP_COLOR[variant] ?? "") : "";
	return (
		<span className={`tooltip ${placementClass} ${colorClass}`} data-tip={tip ?? ""}>
			{children}
		</span>
	);
}

function Stats({ direction = "horizontal", children }: { direction?: string; children: ReactNode }) {
	const directionClass = STATS_DIRECTION[direction] ?? STATS_DIRECTION.horizontal;
	return <div className={`stats ${directionClass} shadow-sm my-4`}>{children}</div>;
}

function Stat({ title, value, desc }: { title?: string; value?: string; desc?: string }) {
	return (
		<div className="stat">
			{title ? <div className="stat-title">{title}</div> : null}
			{value ? <div className="stat-value">{value}</div> : null}
			{desc ? <div className="stat-desc">{desc}</div> : null}
		</div>
	);
}

function WindowMockup({ title, children }: { title?: string; children: ReactNode }) {
	// DaisyUI's mockup-window has no title slot: its traffic-light dots are a
	// ::before pseudo-element that occupies the chrome row, so a flowed child
	// would land on the line below. Overlay the caption into that row instead —
	// the component is position:relative with 1.25rem top padding and a 0.75rem
	// dot row, so top-[1.25rem] + leading-3 centers the text on the dots.
	return (
		<div className="mockup-window border border-base-300 bg-base-100 my-4">
			{title ? (
				<div className="pointer-events-none absolute inset-x-0 top-[1.25rem] text-center text-xs leading-3 text-base-content/60">
					{title}
				</div>
			) : null}
			<div className="border-t border-base-300 px-6 py-8">{children}</div>
		</div>
	);
}

// Reusable flex layout primitive. Lays out its children on either axis with
// optional gap/align/justify — the general grouping tool (e.g. to compose a
// multi-element `[carousel]` slide, or to stack an image over a caption).
function Group({
	direction = "vertical",
	gap = "md",
	align,
	justify,
	children,
}: {
	direction?: string;
	gap?: string;
	align?: string;
	justify?: string;
	children: ReactNode;
}) {
	const directionClass = GROUP_DIRECTION[direction] ?? GROUP_DIRECTION.vertical;
	const gapClass = GROUP_GAP[gap] ?? GROUP_GAP.md;
	const alignClass = align ? (GROUP_ALIGN[align] ?? "") : "";
	const justifyClass = justify ? (GROUP_JUSTIFY[justify] ?? "") : "";
	// Margin-free (like `[block]`) so spacing is compositional — a `[group]`
	// nested in a card/carousel-item/another group adds no surprise margin.
	return (
		<div className={`flex ${directionClass} ${gapClass} ${alignClass} ${justifyClass}`}>
			{children}
		</div>
	);
}

export const daisyDisplayPack: InlineTagDefinition[] = [
	{
		name: "card",
		kind: "paired",
		props: cardProps,
		render: ({ props, children }) => (
			<Card
				title={props?.title as string | undefined}
				variant={props?.variant as string | undefined}
				size={props?.size as string | undefined}
			>
				{children}
			</Card>
		),
	},
	{
		name: "tooltip",
		kind: "paired",
		props: tooltipProps,
		render: ({ props, children }) => (
			<Tooltip
				tip={props?.tip as string | undefined}
				placement={props?.placement as string | undefined}
				variant={props?.variant as string | undefined}
			>
				{children}
			</Tooltip>
		),
	},
	{
		name: "radial-progress",
		kind: "void",
		props: radialProgressProps,
		render: ({ props, runtime }) => (
			<RadialProgress
				value={props?.value as string | undefined}
				max={props?.max as number | undefined}
				variant={props?.variant as string | undefined}
				size={props?.size as string | undefined}
				observed={runtime?.observedVars}
			/>
		),
	},
	{
		name: "stats",
		kind: "paired",
		props: statsProps,
		render: ({ props, children }) => (
			<Stats direction={props?.direction as string | undefined}>{children}</Stats>
		),
	},
	{
		name: "stat",
		kind: "void",
		props: statProps,
		render: ({ props }) => (
			<Stat
				title={props?.title as string | undefined}
				value={props?.value as string | undefined}
				desc={props?.desc as string | undefined}
			/>
		),
	},
	{
		name: "window-mockup",
		kind: "paired",
		props: windowMockupProps,
		render: ({ props, children }) => (
			<WindowMockup title={props?.title as string | undefined}>{children}</WindowMockup>
		),
	},
	{
		name: "group",
		kind: "paired",
		props: groupProps,
		render: ({ props, children }) => (
			<Group
				direction={props?.direction as string | undefined}
				gap={props?.gap as string | undefined}
				align={props?.align as string | undefined}
				justify={props?.justify as string | undefined}
			>
				{children}
			</Group>
		),
	},
];
