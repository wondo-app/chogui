// Minimal tween + interpolation for the 3D devices engine. The easing and
// interpolation helpers are pure (runtime-free, unit-tested); `animate` drives
// them with requestAnimationFrame and degrades to an instant final value when rAF
// is unavailable (SSR / node tests) or the duration is non-positive — so a tween
// device always reaches its outcome even where animation can't run.

export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Interpolate between two angles (radians) along the shortest arc, so a spinner
// settling from 350°→10° travels +20°, not −340°.
export function lerpAngle(from: number, to: number, t: number): number {
  const TWO_PI = Math.PI * 2;
  let delta = (to - from) % TWO_PI;
  if (delta > Math.PI) delta -= TWO_PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return from + delta * t;
}

export interface AnimateOptions {
  durationMs: number;
  easing?: Easing;
  /** Called each frame with eased progress in [0, 1]. */
  onUpdate: (eased: number) => void;
  onDone?: () => void;
}

export interface AnimationHandle {
  cancel(): void;
}

export function animate({
  durationMs,
  easing = easeOutCubic,
  onUpdate,
  onDone,
}: AnimateOptions): AnimationHandle {
  // No rAF (SSR / tests) or non-positive duration: jump straight to the end.
  if (typeof requestAnimationFrame !== "function" || durationMs <= 0) {
    onUpdate(1);
    onDone?.();
    return { cancel() {} };
  }

  let raf = 0;
  let cancelled = false;
  let start: number | null = null;

  const step = (now: number) => {
    if (cancelled) return;
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / durationMs);
    onUpdate(easing(t));
    if (t < 1) {
      raf = requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };

  raf = requestAnimationFrame(step);
  return {
    cancel() {
      cancelled = true;
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    },
  };
}
