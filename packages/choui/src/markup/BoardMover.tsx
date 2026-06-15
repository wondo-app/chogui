// `[board]` (Phase A) — a board whose piece moves to one of N cells on the
// choui-three engine. Reuses the shared Stage, tween, the canvas label builder, and
// a procedural pawn as the piece (no physics). In the sandbox the cells/target come
// from `labels`/`value` props; the live reader will instead read the branch `choices`
// and route selection through `onSelectChoice` (Phase B). Degrades to a plain label list.

import { useMemo } from "react";

import { resolveValue } from "./resolve-value";
import { use3DDevice } from "./use3DDevice";

export interface BoardMoverProps {
  /**
   * Cell labels: an array is used as-is (indices preserved, so they stay in
   * lockstep with `onSelect`); an authored string is comma-split, trimmed,
   * and empties dropped. Hosts mapping live choices MUST pass the array form —
   * a label containing a comma would otherwise shift the index mapping.
   */
  labels?: string | readonly string[];
  value?: string;
  layout?: "ring" | "half" | "track" | "grid";
  size?: string;
  /** Named colorway (bone, ink, sage, amber, coral, sky). */
  color?: string;
  /** Surface texture name (paper, marble, wood, etc.). */
  texture?: string;
  /** Piece body shape: cone, skittle, or pin. */
  piece?: string;
  /** Play the landing sound. */
  sound?: boolean;
  /** Enable soft shadows. */
  shadow?: boolean | number;
  observedVars?: Record<string, unknown>;
  /** Fired when a cell is pressed (Phase B wires this to the branch choice). */
  onSelect?: (index: number) => void;
}

const SIZE_PX: Record<string, number> = { sm: 240, md: 340, lg: 440 };

export function BoardMover(props: BoardMoverProps) {
  const labels = useMemo(
    () =>
      Array.isArray(props.labels)
        ? (props.labels as readonly string[]).map((s) => String(s).trim())
        : ((props.labels as string | undefined) ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
    [props.labels],
  );
  const count = Math.max(1, labels.length);

  const target = useMemo<number | null>(() => {
    if (props.value === undefined || props.value === "") return null;
    const v = Math.round(resolveValue(props.value, props.observedVars));
    return Math.min(count - 1, Math.max(0, Number.isFinite(v) ? v : 0));
  }, [props.value, props.observedVars, count]);

  const size = SIZE_PX[props.size ?? "md"] ?? 280;

  const { containerRef, failed } = use3DDevice(
    (mod, container, { immediate }) => {
      const stage = new mod.Stage(container, { width: size, height: size, view: "angled", shadow: props.shadow });
      const device = new mod.BoardDevice({
        value: target ?? 0,
        labels,
        layout: props.layout,
        color: props.color,
        texture: props.texture,
        piece: props.piece,
        sound: props.sound,
      });
      device.onSelect?.((i) => props.onSelect?.(i));
      stage.add(device);
      if (target !== null) {
        if (immediate) stage.showImmediately();
        else stage.settle();
      }
      return stage;
    },
    [target, labels.join(","), props.layout, size, props.color, props.texture, props.piece, props.sound],
  );

  // When the board is a choice surface (`onSelect` present) it may be the
  // reader's ONLY way to advance (hypertext mode suppresses the default choice
  // list), so every render path must stay interactive: the degraded fallback
  // renders real buttons, and the 3D canvas (pointer-only, with small in-cell
  // text) is paired with a VISIBLE button legend below it — the legible,
  // keyboard- and screen-reader-reachable form of the same choices.
  const onSelect = props.onSelect;
  const cellButtons = onSelect
    ? labels.map((label, i) => (
        <button
          key={i}
          type="button"
          className={i === target ? "badge badge-primary" : "badge badge-ghost"}
          onClick={() => onSelect(i)}
        >
          {label}
        </button>
      ))
    : null;

  // Nothing to show: no cells and no interaction (e.g. a board in a historical
  // breakpoint, where the live runtime is withheld and no authored labels were
  // given). Render nothing — the default choice list vanishes from history the
  // same way.
  if (labels.length === 0 && !onSelect) return null;

  return (
    <span className="inline-flex items-center justify-center align-middle">
      {failed ? (
        <span className="inline-flex gap-2" aria-live="polite" aria-label="board choices">
          {cellButtons ??
            labels.map((label, i) => (
              <span key={i} className={i === target ? "badge badge-primary" : "badge badge-ghost"}>
                {label}
              </span>
            ))}
        </span>
      ) : (
        <span className="inline-flex flex-col items-center gap-2">
          <span
            ref={containerRef}
            aria-hidden="true"
            style={{ display: "inline-block", width: size, height: size }}
          />
          {cellButtons ? (
            <span className="inline-flex flex-wrap justify-center gap-2" aria-label="board choices">
              {cellButtons}
            </span>
          ) : (
            <span aria-live="polite" className="sr-only">{`board: ${labels[target] ?? ""}`}</span>
          )}
        </span>
      )}
    </span>
  );
}
