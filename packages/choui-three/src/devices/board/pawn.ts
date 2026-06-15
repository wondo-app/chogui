// Procedural pawn (board-game piece) for the `[board]` device. Three body shapes
// modelled on classic plastic game pieces, each a 2D profile revolved around Y with
// LatheGeometry (same technique as the spintop's base taper/stem in `geometry.ts`):
//   - "cone"    — a tapered cone on a flat ringed base (the traffic-cone / token).
//   - "skittle" — a waisted bowling-pin with a rounded head (the classic Ludo pawn).
//   - "pin"     — a spherical ball on a thin neck flaring to a wide base (the chess-pawn).

import { Group, LatheGeometry, Mesh, MeshStandardMaterial, Texture, Vector2 } from "three";

export type PawnVariant = "cone" | "skittle" | "pin";

/** Selectable body shapes, in picture order. */
export const PAWN_VARIANTS: PawnVariant[] = ["cone", "skittle", "pin"];

export interface PawnOptions {
  /** Which body shape to build. Default: "skittle". */
  variant?: PawnVariant;
  /** Body hex color. Default: "#13280E" (the dark game-piece color). */
  color?: string;
  /** Optional surface texture image, multiplied over the base color. */
  surface?: HTMLImageElement | null;
}

const DEFAULT_COLOR = "#13280E";
const SEGMENTS = 32;

const v = (r: number, y: number) => new Vector2(Math.max(r, 0.001), y);

// All profiles go bottom→top, radius around the Y axis, and rest on y=0. They share
// roughly the same envelope (≤0.56 tall, ≤0.24 wide) so swapping variants doesn't
// change how the piece sits on the board.

// "cone": flat ringed base → steep cone → softly blunted tip.
function coneProfile(): Vector2[] {
  return [
    v(0.001, 0),
    v(0.215, 0), // wide flat base
    v(0.215, 0.05), // base collar / ring
    v(0.185, 0.062), // step in off the collar
    v(0.165, 0.085), // cone shoulder
    v(0.135, 0.16),
    v(0.105, 0.25),
    v(0.078, 0.34),
    v(0.052, 0.43),
    v(0.03, 0.5),
    v(0.014, 0.54), // small rounded tip
    v(0.001, 0.555),
  ];
}

// "skittle": rounded base bulge → narrow waist → rounded head → rounded top.
function skittleProfile(): Vector2[] {
  return [
    v(0.001, 0),
    v(0.12, 0), // base contact ring
    v(0.175, 0.022), // round out the foot
    v(0.198, 0.06), // lower bulge (widest)
    v(0.193, 0.1),
    v(0.16, 0.16),
    v(0.122, 0.23),
    v(0.108, 0.29), // waist (narrowest)
    v(0.118, 0.34),
    v(0.152, 0.4), // head rising
    v(0.165, 0.45), // head (widest)
    v(0.15, 0.5),
    v(0.097, 0.54),
    v(0.001, 0.56), // rounded crown
  ];
}

// "pin": wide flared base → thin neck → spherical ball head.
function pinProfile(): Vector2[] {
  const profile: Vector2[] = [
    v(0.001, 0),
    v(0.235, 0), // wide base disc
    v(0.235, 0.026), // base rim
    v(0.205, 0.046), // start the concave flare
    v(0.15, 0.085),
    v(0.1, 0.135),
    v(0.062, 0.195),
    v(0.048, 0.255), // neck
    v(0.046, 0.3), // neck top
  ];
  // Ball head: a sphere arc that joins the neck (≈θ=-66°) and closes at the top.
  const cy = 0.405;
  const rb = 0.118;
  const START = (-66 * Math.PI) / 180;
  const END = Math.PI / 2;
  const STEPS = 12;
  for (let i = 0; i <= STEPS; i++) {
    const a = START + (END - START) * (i / STEPS);
    profile.push(v(rb * Math.cos(a), cy + rb * Math.sin(a)));
  }
  return profile;
}

function profileFor(variant: PawnVariant): Vector2[] {
  switch (variant) {
    case "cone":
      return coneProfile();
    case "pin":
      return pinProfile();
    case "skittle":
    default:
      return skittleProfile();
  }
}

/**
 * Build a pawn mesh group. The local origin sits at the base-bottom centre so
 * the pawn rests naturally on a surface at y=0.
 */
export function buildPawn(opts: PawnOptions = {}): Group {
  const color = opts.color ?? DEFAULT_COLOR;
  const surfTex = opts.surface ? new Texture(opts.surface) : null;
  if (surfTex) surfTex.needsUpdate = true;
  const mat = new MeshStandardMaterial({
    color,
    map: surfTex,
    roughness: 0.4,
    metalness: 0.3,
  });

  const geom = new LatheGeometry(profileFor(opts.variant ?? "skittle"), SEGMENTS);
  const mesh = new Mesh(geom, mat);
  mesh.castShadow = true;

  const group = new Group();
  group.add(mesh);
  return group;
}
