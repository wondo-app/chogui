// The core inline-tag pack: the 10 built-in tags expressed as registry
// definitions wrapping the existing markup components. These live here as the
// canonical pack and are authored against the same contract as community tags
// — there is no privileged dispatch path in StoryMarkup for them.

import { Banner } from "./markup/Banner";
import { Block } from "./markup/Block";
import { ChoiceLink } from "./markup/ChoiceLink";
import { Divider } from "./markup/Divider";
import { Highlight } from "./markup/Highlight";
import { Img } from "./markup/Img";
import { Info } from "./markup/Info";
import { Picture } from "./markup/Picture";
import { Progress } from "./markup/Progress";
import { Spoiler } from "./markup/Spoiler";
import type { InlineTagDefinition } from "./contract";
import {
	bannerProps,
	blockProps,
	imgProps,
	infoProps,
	linkProps,
	pictureProps,
	progressProps,
} from "./manifest";

// The tags below that take authored attributes declare a `props` schema (from
// the manifest, the single source the validator + docs also read). Their render
// functions consume the *coerced* `ctx.props` values — `props.max` arrives a
// number, `props.choice` a number — rather than parsing raw strings inline.
// Tags with no attributes (divider, highlight, spoiler) declare no schema and
// read nothing off the context.
export const coreInlineTags: InlineTagDefinition[] = [
	{ name: "divider", kind: "void", render: () => <Divider /> },
	{
		name: "highlight",
		kind: "paired",
		render: ({ children }) => <Highlight>{children}</Highlight>,
	},
	{
		name: "info",
		kind: "paired",
		props: infoProps,
		render: ({ props, children }) => (
			<Info variant={props?.variant as string | undefined} style={props?.style as string | undefined}>
				{children}
			</Info>
		),
	},
	{
		name: "banner",
		kind: "paired",
		props: bannerProps,
		render: ({ props, children }) => (
			<Banner
				variant={props?.variant as string | undefined}
				style={props?.style as string | undefined}
			>
				{children}
			</Banner>
		),
	},
	{
		name: "spoiler",
		kind: "paired",
		render: ({ children }) => <Spoiler>{children}</Spoiler>,
	},
	{
		name: "block",
		kind: "paired",
		props: blockProps,
		render: ({ props, children }) => (
			<Block width={props?.width as string | undefined}>{children}</Block>
		),
	},
	{
		name: "link",
		kind: "paired",
		props: linkProps,
		render: ({ props, children, runtime }) => (
			<ChoiceLink
				choice={props?.choice as number | undefined}
				variant={props?.variant as string | undefined}
				hover={props?.hover as boolean | undefined}
				onSelectChoice={runtime?.onSelectChoice}
			>
				{children}
			</ChoiceLink>
		),
	},
	{
		name: "progress",
		kind: "void",
		props: progressProps,
		render: ({ props, runtime }) => (
			<Progress
				value={props?.value as string | undefined}
				max={props?.max as number | undefined}
				variant={props?.variant as string | undefined}
				observed={runtime?.observedVars}
			/>
		),
	},
	{
		name: "picture",
		kind: "void",
		props: pictureProps,
		render: ({ props }) => (
			<Picture
				src={props?.src as string | undefined}
				alt={props?.alt as string | undefined}
				caption={props?.caption as string | undefined}
				variation={props?.variation as string | undefined}
			/>
		),
	},
	{
		name: "img",
		kind: "void",
		props: imgProps,
		render: ({ props }) => (
			<Img src={props?.src as string | undefined} alt={props?.alt as string | undefined} />
		),
	},
];
