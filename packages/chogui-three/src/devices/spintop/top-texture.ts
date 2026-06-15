// A horizontal strip of N labelled cells, wrapped around the side of an N-sided prism (the
// cylinder side UV runs 0..1 around the circumference, so one cell maps to one flat side).
// Each face shows a SHORT label (1–2 chars max — a number when unlabelled), drawn at the
// TOP and BOTTOM of the face (the bottom one inverted, pirinola-style, so one reading is
// always right-side-up however the top lands). Dice glyph styling: Arial, no outline, the
// colorset foreground. The caller passes a `height` matched to the face aspect, so glyphs
// are NOT distorted. An optional surface texture is multiplied over the base. Null without DOM.
//
// Returns both a color map and a grayscale bump map (the same embossing technique the dice
// pips use) so the face labels read with tactile depth.

import { CanvasTexture, type Texture } from "three";
import { readCssFont } from "../../engine/face-texture";

export interface TopSideTextures {
  map: Texture;
  bumpMap: Texture;
}

export interface TopSideTextureOptions {
  height?: number;
  background?: string;
  foreground?: string;
  labels?: string[];
  surface?: HTMLImageElement | null;
  /** CSS font-family for text labels. Defaults to the host's `--font-body`
   *  variable (falls back to `ui-sans-serif, system-ui, sans-serif`). */
  fontFamily?: string;
}

export function makeTopSideTexture(count: number, opts: TopSideTextureOptions = {}): TopSideTextures | null {
  if (typeof document === "undefined") return null;
  const n = Math.max(1, count);
  const cell = 256;
  const h = Math.max(64, Math.round(opts.height ?? 256));
  const bg = opts.background ?? "#F9ECDD";
  const fg = opts.foreground ?? "#13280E";
  const fontFamily = opts.fontFamily ?? readCssFont("--font-body", "ui-sans-serif, system-ui, sans-serif");

  const render = (fill: string, draw: (ctx: CanvasRenderingContext2D, i: number, cx: number) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = n * cell;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.floor(Math.min(cell, h) * 0.3)}px ${fontFamily}`;

    for (let i = 0; i < n; i++) {
      ctx.fillStyle = fill;
      ctx.fillRect(i * cell, 0, cell, h);
      draw(ctx, i, i * cell + cell / 2);
    }
    return new CanvasTexture(canvas);
  };

  const map = render(bg, (ctx, i, cx) => {
    if (opts.surface) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(opts.surface, i * cell, 0, cell, h);
      ctx.restore();
    }

    const label = (opts.labels?.[i]?.trim() || String(i + 1)).slice(0, 2);
    ctx.fillStyle = fg;
    // Top — upright.
    ctx.fillText(label, cx, h * 0.27, cell * 0.8);
    // Bottom — inverted.
    ctx.save();
    ctx.translate(cx, h * 0.73);
    ctx.rotate(Math.PI);
    ctx.fillText(label, 0, 0, cell * 0.8);
    ctx.restore();
  });

  const bumpMap = render("#ffffff", (ctx, _i, cx) => {
    const label = (opts.labels?.[_i]?.trim() || String(_i + 1)).slice(0, 2);
    ctx.fillStyle = "#000000";
    ctx.fillText(label, cx, h * 0.27, cell * 0.8);
    ctx.save();
    ctx.translate(cx, h * 0.73);
    ctx.rotate(Math.PI);
    ctx.fillText(label, 0, 0, cell * 0.8);
    ctx.restore();
  });

  if (!map || !bumpMap) return null;
  return { map, bumpMap };
}
