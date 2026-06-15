import { describe, expect, it } from "vitest";

import {
  CDN_ASSET_PATH,
  DEFAULT_ASSET_PATH,
  resolveAssetPath,
} from "../engine/assets";
import {
  animate,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  lerpAngle,
  linear,
} from "../engine/tween";

const TWO_PI = Math.PI * 2;

describe("tween easing", () => {
  it("anchors every easing at 0 and 1", () => {
    for (const e of [linear, easeOutCubic, easeInOutCubic]) {
      expect(e(0)).toBeCloseTo(0);
      expect(e(1)).toBeCloseTo(1);
    }
  });

  it("easeOutCubic is monotonically increasing", () => {
    let prev = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeOutCubic(Math.min(1, t));
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("interpolation", () => {
  it("lerp interpolates linearly", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(2, 4, 0)).toBe(2);
    expect(lerp(2, 4, 1)).toBe(4);
  });

  it("lerpAngle takes the shortest arc across the 0/2π wrap", () => {
    const from = (350 / 360) * TWO_PI;
    const to = (10 / 360) * TWO_PI;
    // +20° arc, so the midpoint sits +10° from `from` (i.e. ~360°/0°).
    const expected = from + (20 / 360) * TWO_PI * 0.5;
    expect(lerpAngle(from, to, 0.5)).toBeCloseTo(expected, 5);
  });
});

describe("animate (node env: no requestAnimationFrame)", () => {
  it("jumps to the final value synchronously", () => {
    const updates: number[] = [];
    let done = false;
    animate({
      durationMs: 500,
      onUpdate: (v) => updates.push(v),
      onDone: () => {
        done = true;
      },
    });
    expect(updates).toEqual([1]);
    expect(done).toBe(true);
  });

  it("jumps immediately for a non-positive duration", () => {
    const updates: number[] = [];
    animate({ durationMs: 0, onUpdate: (v) => updates.push(v) });
    expect(updates).toEqual([1]);
  });
});

describe("resolveAssetPath", () => {
  it("defaults to the host-vendored path", () => {
    expect(resolveAssetPath()).toBe(DEFAULT_ASSET_PATH);
  });

  it("honors an explicit path and guarantees a trailing slash", () => {
    expect(resolveAssetPath("/x/y")).toBe("/x/y/");
    expect(resolveAssetPath("/x/y/")).toBe("/x/y/");
    expect(resolveAssetPath("  /spaced/  ")).toBe("/spaced/");
  });

  it("falls back to the CDN when asked", () => {
    expect(resolveAssetPath(undefined, { preferCdn: true })).toBe(CDN_ASSET_PATH);
  });
});
