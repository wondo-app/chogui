// Build a round disc face as a color `CanvasTexture` + a grayscale bump `CanvasTexture`
// (the relief) — the same technique the dice pips use. `content` is either text or a
// loaded image (e.g. a rasterized SVG or glyph). Returns null without a DOM (SSR / tests),
// so callers fall back cleanly. Shared engine helper — the `[board]` piece + cell labels
// use it. (Kept its `makeCoinFaceTexture` name; it draws any disc face, not just a coin.)

import { CanvasTexture, type Texture } from "three";

export interface CoinFaceTextures {
  map: Texture;
  bumpMap: Texture;
}

export interface CoinFaceOptions {
  size?: number;
  background?: string;
  foreground?: string;
  /** CSS font-family for text labels. Defaults to the host's `--font-body`
   *  variable (falls back to `ui-sans-serif, system-ui, sans-serif`). */
  fontFamily?: string;
}

export function makeCoinFaceTexture(
  content: string | HTMLImageElement,
  opts: CoinFaceOptions = {},
): CoinFaceTextures | null {
  if (typeof document === "undefined") return null;
  const size = opts.size ?? 256;
  const bg = opts.background ?? "#c9a14a";
  const fg = opts.foreground ?? "#3a2c0a";
  const fontFamily = opts.fontFamily ?? readCssFont("--font-body", "ui-sans-serif, system-ui, sans-serif");

  const render = (fill: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    draw(ctx);
    return new CanvasTexture(canvas);
  };

  const paint = (ctx: CanvasRenderingContext2D, textColor: string) => {
    if (typeof content === "string") {
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.floor(size * (content.length > 2 ? 0.26 : 0.5));
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillText(content, 0, 0, size * 0.8);
    } else {
      const d = size * 0.6;
      ctx.drawImage(content, -d / 2, -d / 2, d, d);
    }
  };

  const map = render(bg, (ctx) => paint(ctx, fg));
  const bumpMap = render("#ffffff", (ctx) => paint(ctx, "#000000"));
  if (!map || !bumpMap) return null;
  return { map, bumpMap };
}

/** Read a CSS custom property from the document root, stripping CSS quotes. */
export function readCssFont(varName: string, fallback: string): string {
  if (typeof getComputedStyle !== "function") return fallback;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallback;
    // Strip surrounding quotes from font names ("Gatwick" → Gatwick).
    return raw.replace(/"/g, "");
  } catch {
    return fallback;
  }
}
