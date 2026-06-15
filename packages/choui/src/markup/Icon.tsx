import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Check,
	Coins,
	Compass,
	Crown,
	Eye,
	FlaskConical,
	Flame,
	Footprints,
	Gem,
	Heart,
	Key,
	Lock,
	type LucideIcon,
	MapPin,
	Minus,
	Plus,
	Scroll,
	Shield,
	Skull,
	Star,
	Sword,
	Swords,
	X,
	Zap,
} from "lucide-react";

// Curated allowlist of game-fiction glyphs. Explicit named imports (not lucide's
// full `icons` map) keep the bundle lean and the vocabulary curated — adding a
// glyph is a deliberate one-line edit here plus the matching `iconProps.name`
// enum entry in ../manifest (a test guards the two against drift). An unknown
// name renders nothing, mirroring how `[img]` returns null without a `src`.
const ICON_MAP: Record<string, LucideIcon> = {
	heart: Heart,
	sword: Sword,
	swords: Swords,
	key: Key,
	coin: Coins,
	gem: Gem,
	potion: FlaskConical,
	shield: Shield,
	skull: Skull,
	scroll: Scroll,
	flame: Flame,
	bolt: Zap,
	map: MapPin,
	crown: Crown,
	book: BookOpen,
	lock: Lock,
	eye: Eye,
	star: Star,
	compass: Compass,
	footprints: Footprints,
	// Small UI affordance subset (quest completion, navigation, +/- counters).
	check: Check,
	close: X,
	plus: Plus,
	minus: Minus,
	"arrow-right": ArrowRight,
	"arrow-left": ArrowLeft,
};

/** The curated icon names, exported so a test can assert parity with the manifest enum. */
export const ICON_NAMES: readonly string[] = Object.keys(ICON_MAP);

// Full class literals (not interpolated) so Tailwind's content scan emits them.
const COLOR_CLASS: Record<string, string> = {
	primary: "text-primary",
	info: "text-info",
	success: "text-success",
	warning: "text-warning",
	error: "text-error",
	neutral: "text-neutral",
};
const SIZE_PX: Record<string, number> = { xs: 14, sm: 18, md: 22, lg: 28 };

/**
 * `[icon name="heart"]` — a curated lucide glyph. Sizes via `size`, tints via
 * `variant` (`text-*`); defaults to `currentColor` so it inherits the prose ink.
 */
export function Icon({
	name,
	size = "sm",
	variant,
}: {
	name?: string;
	size?: string;
	variant?: string;
}) {
	if (!name) return null;
	const Glyph = ICON_MAP[name];
	if (!Glyph) return null;
	const px = SIZE_PX[size] ?? SIZE_PX.sm;
	const color = variant ? (COLOR_CLASS[variant] ?? "") : "";
	return <Glyph size={px} className={`inline-block align-text-bottom ${color}`} aria-hidden="true" />;
}
