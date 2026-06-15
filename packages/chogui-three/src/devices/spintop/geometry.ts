// Teetotum / pirinola geometry for the `[spintop]` device. Even side counts only (4 or 6).
// A short prism with LABELED flat side faces, a beveled top edge, a curved-but-faceted short
// bottom tapering to a small tip (the spinning contact — backed by a small physics sphere so
// it can't balance and always topples onto a side), and a LONG THIN handle dowel on top.
// Faces carry text labels (or numbers) via `makeTopSideTexture`, plus an optional surface texture.

import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Texture,
  Vector2,
} from "three";

import { makeTopSideTexture } from "./top-texture";

export const RADIUS = 0.85; // body radius (brought in slightly for a slimmer top)
export const BODY_H = 1.4; // labeled body height
export const POINT_H = 0.45; // SHORT base (round taper + half-ball), the spinning contact
export const STUB_R = 0.18; // tip radius of the faceted bottom + the physics contact sphere
export const TOP_CHAMFER_H = 0.1; // rounded-ish top edge
export const STEM_H = 1.35; // long thin handle dowel (raises the COM → topples readily)
export const STEM_R = 0.13;

/** Clamp a desired side count to an even value in [4, 6] (odd counts not allowed). */
export function evenSides(desired: number): number {
  const e = 2 * Math.round((desired || 4) / 2);
  return Math.min(6, Math.max(4, e));
}

const DEFAULT_BODY = "#F9ECDD"; // bone body (matches the dice colorset)

export interface TeetotumOptions {
  /** Face labels; a face with no label shows its number. */
  labels?: string[];
  surface?: HTMLImageElement | null;
  /** Body base color (hex). The surface texture multiplies over it; solid when no texture. */
  color?: string;
  /** Numeral/label color (hex) — the dice colorset foreground. */
  foreground?: string;
  /** Raise the group's local origin (the rotation pivot / physics COM) this far above the
   *  body-cylinder center — a "heavy handle" so the top topples in a big slow arc. */
  comOffset?: number;
}

/** Build the teetotum mesh group. The local origin is the rotation pivot (the COM): the
 *  body-cylinder center, raised by `comOffset` toward the handle. */
export function buildTeetotum(count: number, opts: TeetotumOptions = {}): Group {
  const bodyColor = opts.color || DEFAULT_BODY;
  // Faces: the body color, the texture multiplied over it, the label/number on top.
  // Match the label-cell aspect to the actual face (faceWidth = 2πR/count, faceHeight =
  // BODY_H) so glyphs aren't stretched when the square cell maps onto a non-square face.
  const cellHeight = Math.round((256 * BODY_H * count) / (2 * Math.PI * RADIUS));
  const sideTex = makeTopSideTexture(count, {
    labels: opts.labels,
    surface: opts.surface,
    background: bodyColor,
    foreground: opts.foreground,
    height: cellHeight,
  });

  // One shared surface texture for every non-face surface (cap, chamfer, stem, base); the
  // material's body color tints it in the shader.
  const surfTex = opts.surface ? new Texture(opts.surface) : null;
  if (surfTex) surfTex.needsUpdate = true;

  const cap = new MeshStandardMaterial({ color: bodyColor, map: surfTex, roughness: 0.6, metalness: 0.1 });
  const side = new MeshStandardMaterial({
    map: sideTex?.map ?? null,
    bumpMap: sideTex?.bumpMap ?? null,
    bumpScale: sideTex ? 0.6 : 0,
    color: sideTex ? "#ffffff" : bodyColor, // canvas already carries the body color
    roughness: 0.55,
    metalness: 0.1,
  });
  const baseMat = new MeshStandardMaterial({ color: bodyColor, map: surfTex, roughness: 0.6 });

  const body = new Mesh(new CylinderGeometry(RADIUS, RADIUS, BODY_H, count), [side, cap, cap]);
  body.castShadow = true;

  const topChamfer = new Mesh(new CylinderGeometry(RADIUS * 0.8, RADIUS, TOP_CHAMFER_H, count), cap);
  topChamfer.position.y = BODY_H / 2 + TOP_CHAMFER_H / 2;
  topChamfer.castShadow = true;

  // Curved but FACETED short bottom — a cone revolved with `count` segments (facets aligned
  // with the body sides), curving from the body radius down to a closed tip (r → 0). The
  // facet lines are gently curved (exponent just under 1 = convex). It closes to a point so
  // there's no open ring. (The physics contact is a small sphere at the tip — see the device.)
  const BASE_STEPS = 12;
  const baseProfile: Vector2[] = [];
  for (let i = 0; i <= BASE_STEPS; i++) {
    const u = 1 - i / BASE_STEPS; // tip (u=1) up to the body bottom (u=0)
    const r = RADIUS * Math.pow(1 - u, 0.8);
    baseProfile.push(new Vector2(Math.max(r, 0.001), -POINT_H * u));
  }
  const base = new Mesh(new LatheGeometry(baseProfile, count), baseMat);
  base.position.y = -BODY_H / 2;
  base.castShadow = true;

  // Long thin handle dowel — mostly straight, rounded over the top ~25%.
  const STEM_STEPS = 16;
  const stemProfile: Vector2[] = [];
  for (let i = 0; i <= STEM_STEPS; i++) {
    const u = i / STEM_STEPS; // 0 at the base, 1 at the top
    const r = u < 0.75 ? STEM_R : STEM_R * Math.cos(((u - 0.75) / 0.25) * (Math.PI / 2));
    stemProfile.push(new Vector2(Math.max(r, 0.001), STEM_H * u));
  }
  const stem = new Mesh(new LatheGeometry(stemProfile, 16), cap);
  stem.position.y = BODY_H / 2 + TOP_CHAMFER_H;
  stem.castShadow = true;

  // Wrap in an outer group whose origin sits `comOffset` above the body center, so the
  // device rotates the top about that raised pivot (the COM).
  const inner = new Group();
  inner.add(base, body, topChamfer, stem);
  inner.position.y = -(opts.comOffset ?? 0);
  const group = new Group();
  group.add(inner);
  return group;
}
