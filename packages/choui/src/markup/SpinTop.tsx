// `[spintop]` — an N-sided spinning top on the choui-three engine, driven by a cannon-es
// solver: thrown spinning, it topples and tumbles like a real teetotum. The 3D is
// decorative (degrades to a text label). Two modes, mirroring `[coin]`/`[dice]`:
//   - VISUALIZER (`value`): show an Ink-decided face — generates no randomness, writes
//     nothing. Branch-safe.
//   - SELF-ROLL (`var`, no `value`): pick a face client-side and write it to an observed
//     Ink variable via `onSetVariable` — FLAVOR ONLY (must not gate a branch).

import { useEffect, useMemo, useRef } from "react";

import { randomInt } from "../logic/random";
import { resolveValue } from "./resolve-value";
import { use3DDevice } from "./use3DDevice";

export interface SpinTopProps {
  value?: string;
  /** Self-roll target: an observed Ink variable to write the picked index to (flavor only). */
  varName?: string;
  actions?: string;
  sides?: number;
  size?: string;
  color?: string;
  texture?: string;
  sound?: boolean;
  shadow?: boolean | number;
  flavor?: boolean;
  observedVars?: Record<string, unknown>;
  onSetVariable?: (name: string, value: number | string | boolean) => void;
}

const SIZE_PX: Record<string, number> = { sm: 200, md: 300, lg: 400 };

export function SpinTop(props: SpinTopProps) {
  const actions = useMemo(
    () =>
      (props.actions ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    [props.actions],
  );
  // Even side counts only (4 or 6) — must match the engine's `evenSides`.
  const count = useMemo(
    () => Math.min(6, Math.max(4, 2 * Math.round((props.sides ?? actions.length ?? 4) / 2))),
    [props.sides, actions.length],
  );

  const controlled = props.value !== undefined && props.value !== "";
  // Self-roll picks once per mount/count (flavor only); the visualizer ignores it.
  const rolled = useMemo(
    () => (controlled ? 0 : randomInt(count) - 1),
    [controlled, count],
  );
  const index = useMemo(() => {
    if (!controlled) return rolled;
    const v = Math.round(resolveValue(props.value, props.observedVars));
    return Math.min(count - 1, Math.max(0, Number.isFinite(v) ? v : 0));
  }, [controlled, rolled, props.value, props.observedVars, count]);

  // Self-roll: write the picked index to the observed Ink variable (flavor only).
  // Write ONCE per mount — guarded by a ref, NOT by effect deps. The host may
  // recreate `onSetVariable` every render (the live reader does), and the write
  // itself triggers a host re-render; depending on the callback identity would
  // re-fire the effect on each pass and spin an infinite write→render loop.
  const wroteRef = useRef(false);
  useEffect(() => {
    if (controlled || !props.varName || wroteRef.current) return;
    wroteRef.current = true;
    if (!props.flavor) {
      console.warn(
        `[choui] [spintop var="${props.varName}"] self-roll is flavor-only — it must not gate a branch. Set flavor to silence this.`,
      );
    }
    props.onSetVariable?.(props.varName, rolled);
  }, [controlled, rolled, props.varName, props.flavor, props.onSetVariable]);

  const size = SIZE_PX[props.size ?? "md"] ?? 170;

  const { containerRef, failed } = use3DDevice(
    (mod, container, { immediate }) => {
      const stage = new mod.Stage(container, { width: size, height: size, view: "overhead", shadow: props.shadow });
      stage.add(
        new mod.SpinTopDevice({
          value: index,
          actions,
          sides: props.sides,
          sound: props.sound,
          texture: props.texture,
          color: props.color,
        }),
      );
      if (immediate) stage.showImmediately();
      else stage.settle();
      return stage;
    },
    [index, actions.join(","), props.sides, props.sound, size, props.texture, props.color],
  );

  const label = actions[index] ?? "";

  return (
    <span className="inline-flex items-center justify-center align-middle">
      {failed ? (
        <span className="badge badge-neutral" aria-live="polite">
          {label}
        </span>
      ) : (
        // The 3D face text is decorative and small; the landed face is also
        // captioned in HTML below the canvas so the outcome is always legible.
        <span className="inline-flex flex-col items-center gap-1">
          <span
            ref={containerRef}
            aria-hidden="true"
            style={{ display: "inline-block", width: size, height: size }}
          />
          <span className="badge badge-ghost badge-sm" aria-live="polite">
            {label}
          </span>
        </span>
      )}
    </span>
  );
}
