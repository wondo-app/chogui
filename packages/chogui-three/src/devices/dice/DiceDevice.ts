// `[dice]` device — a polyhedral dice roller on the chogui-three engine. It
// simulates a physics throw in a bounded tray and settles onto predetermined
// faces. The DiceBox vendored engine handles the cannon-es world, dice geometry,
// face swapping, and collision sounds; this class wraps it in the Device
// contract so it mounts into a shared Stage.
//
// Coordinate convention: DiceBox runs UNCHANGED from upstream — its own Z-up world
// at the library's native scale (hundreds of units), where its physics constants
// are internally consistent. We bridge it into the Stage (Y-up, small units) the
// same way SpinTopDevice applies size: a parent Group that rotates Z-up→Y-up and
// scales native→Stage units. The scale is a purely visual transform applied AFTER
// the simulation, so the proven physics is never destabilised.

import { Group } from "three";

import { resolveAssetPath } from "../../engine/assets";
import { WONDO_COLORSETS } from "../../engine/colorsets";
import { DiceBox } from "../../dice-box/DiceBox";
import { disposeObjectTree } from "../../engine/dispose-utils";
import type { Device, DeviceContext, DeviceProps } from "../types";

/** Per-die roll result. */
export interface DieRoll {
  type: string;
  sides: number;
  id: number;
  value: number;
  label: string;
  reason: string;
}

/** Full dice result from a roll. */
export interface DiceResult {
  notation: string;
  sets: Array<{
    num: number;
    type: string;
    sides: number;
    rolls: DieRoll[];
    total: number;
  }>;
  modifier: number;
  total: number;
}

export interface DiceDeviceProps extends DeviceProps {
  /** Dice notation — e.g. `d20`, `2d6+3`, `2d6@3,5` (predetermined). */
  notation: string;
  /**
   * Predetermined per-die face values to visualize (controlled mode).
   * When present the device does NOT roll its own RNG — it only
   * tumbles to these faces. The `notation` provides the dice type/count.
   */
  values?: number[];
  /** Dice color variant. */
  color?: string;
  /** Surface texture overriding the colorset's. */
  texture?: string;
  /** Numeral color override. */
  pips?: string;
  /** Play the dice-box hit/surface sounds. */
  sound?: boolean;
  /** Base URL for textures / sounds. */
  assetPath?: string;
  /** Tray width:height ratio (matches the canvas box) so the tray fills the viewport. */
  trayAspect?: number;
  /** Called when a roll completes with the dice results. */
  onRollComplete?: (result: DiceResult) => void;
}

// DiceBox runs at its native scale (everything in "hundreds of units"). Three knobs:
//   NATIVE_DEPTH — native tray depth (Y extent of the Z-up XY floor; width = depth·aspect).
//     Kept large so the fixed upstream drop height (z=200-400) and throw stay proportionate.
//   DIE_SCALE — DiceBox `baseScale` (die radius = geom·baseScale). The library's native
//     die:tray ratio (90:280 ≈ 0.18) reads tiny in the dice camera, so we enlarge the die
//     directly. baseScale does NOT affect the throw (that keys off `dimensions`), and 170
//     still floors to a 512px face texture.
//   STAGE_SCALE — single uniform visual scale on the parent Group mapping native → Stage
//     units. The "dice" camera (stage.ts: y=12, FOV 20°) frames ≈±2.1 Stage units; this is
//     picked so the larger die rests well inside that with margin (no fly-off / clipping),
//     reading at roughly the spintop's on-screen size. Tune all three in `DiceViewTuning`.
const NATIVE_DEPTH = 280; // native tray depth; width = NATIVE_DEPTH · aspect
const DIE_SCALE = 170; // DiceBox baseScale — bigger dice relative to the tray
const STAGE_SCALE = 0.0045; // native → Stage units, applied to the parent Group (visual only)

const ROLLER_DEFAULTS = {
  shadows: false,
  theme_material: "none",
  light_intensity: 0.92,
  // Native upstream values — the library is tuned as a consistent set at this scale.
  gravity_multiplier: 400,
  strength: 1,
};

// DiceBox colorsets: extend the shared Wondo palette with DiceBox-specific fields.
const COLORSETS: Record<string, { name: string; foreground: string; background: string; outline: string; texture: string }> = Object.fromEntries(
  Object.entries(WONDO_COLORSETS).map(([key, cs]) => [
    key,
    { name: `wondo-${key}`, foreground: cs.foreground, background: cs.background, outline: "none", texture: "none" },
  ]),
);

const PIPS_COLOR: Record<string, string> = { light: "#F9ECDD", dark: "#13280E" };

export class DiceDevice implements Device<DiceResult> {
  readonly kind = "dice";
  // Mutable — DiceBox resolves the result asynchronously (after init + roll settle),
  // unlike Board/SpinTop which know their outcome at construction time.
  outcome: DiceResult = { notation: "", sets: [], modifier: 0, total: 0 };

  private readonly props: DiceDeviceProps;
  private box: DiceBox | null = null;
  /** Parent that rotates the library's Z-up world to the Stage's Y-up and scales it down. */
  private root: Group | null = null;
  private ctx: DeviceContext | null = null;
  private settled = false;
  private rolling = false;
  private disposed = false;
  /** Resolves when DiceBox.initialize() completes (theme loaded, world set up). */
  private initPromise: Promise<void> | null = null;

  constructor(props: DiceDeviceProps) {
    this.props = props;
  }

  mount(ctx: DeviceContext): void {
    this.ctx = ctx;
    const p = this.props;

    const baseColorset = COLORSETS[p.color ?? "bone"] ?? COLORSETS.bone;
    const colorset = {
      ...baseColorset,
      ...(p.texture ? { texture: p.texture } : {}),
      ...(p.pips && p.pips !== "auto" && PIPS_COLOR[p.pips] ? { foreground: PIPS_COLOR[p.pips] } : {}),
    };

    // Bridge group: DiceBox builds its meshes (Z-up, native scale) into this Group.
    // The rotation maps the library's Z-up to the Stage's Y-up; the scale shrinks the
    // hundreds-of-units simulation into the Stage's small world. Both are visual only —
    // the cannon world inside DiceBox stays at native scale and is never touched.
    const aspect = p.trayAspect && p.trayAspect > 0 ? p.trayAspect : 1;
    const root = new Group();
    root.rotation.x = -Math.PI / 2;
    root.scale.setScalar(STAGE_SCALE);
    ctx.scene.add(root);
    this.root = root;

    // DiceBox runs at native upstream scale: its own cannon world, native
    // gravity_multiplier 400, native dimensions; DIE_SCALE enlarges the die.
    this.box = new DiceBox(root, {
      ...ROLLER_DEFAULTS,
      assetPath: resolveAssetPath(p.assetPath),
      sounds: p.sound ?? false,
      baseScale: DIE_SCALE,
      theme_customColorset: colorset,
      dimensions: { x: NATIVE_DEPTH * aspect, y: NATIVE_DEPTH },
    });

    // Initialize the DiceBox: sets up world (gravity, walls), loads theme
    // (creates materials), loads sounds. This is async — store the promise
    // so settle() can await it before rolling.
    this.initPromise = this.box.initialize().catch((err: unknown) => {
      if (!this.disposed) console.warn("[chogui] DiceBox initialization failed:", err);
    });

    // If immediate (reduced motion), we'll swap faces in orientToOutcome().
    if (p.immediate) {
      this.settled = true;
    }
  }

  settle(): void {
    if (!this.box || this.settled) return;
    const notation = this.buildNotation();
    if (!notation) {
      this.settled = true;
      return;
    }

    this.rolling = true;
    // Wait for initialization to complete before rolling — the DiceBox needs
    // its theme (materials) and world (gravity, walls) set up first.
    const roll = () => {
      if (this.disposed) return;
      this.box!.roll(notation).then((results: unknown) => {
        if (this.disposed) return;
        this.rolling = false;
        this.settled = true;
        if (this.props.onRollComplete && results) {
          this.props.onRollComplete(results as DiceResult);
        }
      }).catch((err: unknown) => {
        if (this.disposed) return;
        console.warn("[chogui] Dice roll failed:", err);
        this.rolling = false;
        this.settled = true;
      });
    };

    if (this.initPromise) {
      this.initPromise.then(roll);
    } else {
      roll();
    }
  }

  update(_dtMs: number): boolean {
    // DiceBox runs its own animation loop internally via rAF.
    // We just check if it's settled.
    return this.settled;
  }

  orientToOutcome(): void {
    if (!this.box) return;
    const notation = this.buildNotation();
    if (!notation) return;

    // For reduced motion / instant reveal: show the dice result with no animation.
    const showNow = () => {
      if (this.disposed) return;
      const result = this.box!.showResult(notation);
      if (result && this.props.onRollComplete) {
        this.props.onRollComplete(result as DiceResult);
      }
      this.settled = true;
    };

    if (this.initPromise) {
      this.initPromise.then(showNow);
    } else {
      showNow();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.box?.clearDice?.();
    if (this.root) {
      this.ctx?.scene.remove(this.root);
      disposeObjectTree(this.root);
    }
    this.box = null;
    this.root = null;
    this.ctx = null;
  }

  /** Build the dice notation string, incorporating predetermined values. */
  private buildNotation(): string {
    const p = this.props;
    if (p.values && p.values.length > 0) {
      // Predetermined notation: "2d6@3,5"
      // Parse the base notation to get the dice type, then append @values.
      const base = p.notation.replace(/@.*$/, "");
      return `${base}@${p.values.join(",")}`;
    }
    return p.notation;
  }
}

export function diceFactory(props: DeviceProps): Device {
  return new DiceDevice(props as DiceDeviceProps);
}
