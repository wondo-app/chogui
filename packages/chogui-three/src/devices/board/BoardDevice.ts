// `[board]` device (Phase A) — a board of N cells with a pawn piece that moves to one of
// them. It's the third archetype: not a randomizer but a spatial selector. It reuses the
// shared Stage, the `tween` easing, the canvas face builder (cell labels), and a procedural
// pawn as the piece — colored by the Wondo palette, with optional surface textures and a
// contact sound on landing. Phase A moves the piece to a target cell; the click-to-select
// interactivity (`onSelect` → choice) lands with the reader plumbing.

import {
  CircleGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  RingGeometry,
  Vector3,
} from "three";

import hitUrl from "../../../assets/sounds/dicehit/dicehit_coin1.mp3?url";
import { disposeObjectTree } from "../../engine/dispose-utils";
import { makeCoinFaceTexture } from "../../engine/face-texture";
import { easeInOutCubic, lerp } from "../../engine/tween";
import type { Device, DeviceContext, DeviceProps } from "../types";
import { type BoardLayout, type Cell, cellPositions, defaultLayout } from "./layout";
import { PAWN_VARIANTS, type PawnVariant, buildPawn } from "./pawn";
import { WONDO_COLORSETS } from "../../engine/colorsets";
import { loadSurface } from "../../engine/surface-texture";

export interface BoardDeviceProps extends DeviceProps {
  /** Target cell index the piece moves to. */
  value: number;
  labels: string[];
  layout?: BoardLayout;
  /** Named colorway (bone, ink, sage, amber, coral, sky). */
  color?: string;
  /** Surface texture name (paper, marble, wood, etc.). */
  texture?: string;
  /** Piece body shape: "cone", "skittle" (default), or "pin". */
  piece?: string;
}

const MOVE_MS = 900;
const PIECE_Y = 0.025; // just above the tile surface (y=0.01)

type Phase = "idle" | "moving" | "done";

export class BoardDevice implements Device<number> {
  readonly kind = "board";
  readonly outcome: number;
  private readonly props: BoardDeviceProps;
  private readonly count: number;
  private readonly scale: number;
  private readonly variant: PawnVariant;
  private readonly layout: BoardLayout;
  private readonly cells: Cell[];
  private readonly colorset: { background: string; foreground: string };
  private readonly tiles: Object3D[] = [];
  private originRing: Object3D | null = null;
  private piece: Object3D | null = null;
  private ctx: DeviceContext | null = null;
  private phase: Phase = "idle";
  private elapsed = 0;
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private selectCb: ((index: number) => void) | null = null;
  private sound: HTMLAudioElement | null = null;

  constructor(props: BoardDeviceProps) {
    this.props = props;
    this.count = Math.max(1, props.labels.length);
    this.scale = props.scale ?? 1;
    this.variant = (PAWN_VARIANTS as string[]).includes(props.piece ?? "")
      ? (props.piece as PawnVariant)
      : "skittle";
    this.colorset = WONDO_COLORSETS[props.color ?? "bone"] ?? WONDO_COLORSETS.bone!;
    this.layout = props.layout ?? defaultLayout(this.count);
    // half and track sit closer to the camera bottom (+Z in overhead view).
    const centerZ = this.layout === "ring" ? 0 : 0.8;
    this.cells = cellPositions(this.count, this.layout, undefined, centerZ);
    this.outcome = Math.min(this.count - 1, Math.max(0, Math.round(props.value) || 0));
  }

  private cellWorld(i: number): Vector3 {
    const c = this.cells[Math.min(this.cells.length - 1, Math.max(0, i))]!;
    return new Vector3(c.x * this.scale, PIECE_Y * this.scale, c.z * this.scale);
  }

  /** Starting position before any target is selected. */
  private originPosition(): Vector3 {
    const s = this.scale;
    if (this.layout === "track" || this.layout === "grid") {
      // Just before the first cell — half a cell-spacing, stays in frame.
      const first = this.cellWorld(0);
      const second = this.count > 1 ? this.cellWorld(1) : null;
      const gap = second ? (second.x - first.x) * 0.55 : 0.4 * s;
      return new Vector3(first.x - gap, PIECE_Y * s, first.z);
    }
    // ring and half: center of the board (match the centerZ offset applied to cells).
    const centerZ = this.layout === "ring" ? 0 : 0.8;
    return new Vector3(0, PIECE_Y * s, centerZ * s);
  }

  mount(ctx: DeviceContext): void {
    this.ctx = ctx;
    const cs = this.colorset;

    // Cell tiles with labels (canvas face builder reused).
    for (let i = 0; i < this.count; i++) {
      const c = this.cells[i]!;
      const tex = makeCoinFaceTexture(this.props.labels[i] ?? String(i + 1), {
        background: cs.background,
        foreground: cs.foreground,
      });
      const tile = new Mesh(
        new CircleGeometry(0.42, 40),
        new MeshStandardMaterial({
          map: tex?.map ?? null,
          bumpMap: tex?.bumpMap ?? null,
          bumpScale: tex ? 0.6 : 0,
          color: tex ? "#ffffff" : cs.background,
          roughness: 0.75,
          side: DoubleSide,
        }),
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(c.x * this.scale, 0.01, c.z * this.scale);
      ctx.scene.add(tile);
      this.tiles.push(tile);
      ctx.registerPick(tile, () => this.pick(i));
    }

    // Origin ring: a subtle outline showing where the piece starts.
    const origin = this.originPosition();
    const ring = new Mesh(
      new RingGeometry(0.18, 0.22, 32),
      new MeshBasicMaterial({ color: cs.foreground, opacity: 0.2, transparent: true, side: DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(origin.x, 0.012, origin.z);
    ctx.scene.add(ring);
    this.originRing = ring;

    // Piece: a procedural pawn, colored by the colorset.
    this.buildPiece(ctx, null);

    // Load surface texture and swap in once ready.
    const texture = this.props.texture;
    if (texture && texture !== "none") {
      void loadSurface(texture).then((img) => {
        if (this.ctx !== ctx || !img) return;
        this.buildPiece(ctx, img);
      });
    }

    // Contact sound — a single coin hit on landing.
    if (this.props.sound !== false && typeof Audio !== "undefined") {
      this.sound = new Audio(hitUrl);
      this.sound.volume = 0.3;
    }
  }

  /** (Re)build the pawn visual, preserving the current transform. */
  private buildPiece(ctx: DeviceContext, surface: HTMLImageElement | null): void {
    const prev = this.piece;
    const pawn = buildPawn({ variant: this.variant, color: this.colorset.background, surface });
    pawn.scale.setScalar(this.scale);
    if (prev) {
      pawn.position.copy(prev.position);
      ctx.scene.remove(prev);
      disposeObjectTree(prev);
    } else {
      pawn.position.copy(this.originPosition());
    }
    ctx.scene.add(pawn);
    this.piece = pawn;
  }

  settle(): void {
    this.moveTo(this.outcome);
  }

  onSelect(cb: (index: number) => void): void {
    this.selectCb = cb;
  }

  /** Press a cell: move the piece there and notify the host (the "choice"). */
  private pick(i: number): void {
    this.moveTo(i);
    this.selectCb?.(i);
  }

  private moveTo(i: number): void {
    if (!this.piece) return;
    this.phase = "moving";
    this.elapsed = 0;
    this.from.copy(this.piece.position);
    this.to.copy(this.cellWorld(i));
  }

  update(dtMs: number): boolean {
    if (this.phase !== "moving" || !this.piece) return true;
    this.elapsed += dtMs;
    const t = Math.min(1, this.elapsed / MOVE_MS);
    const eased = easeInOutCubic(t);
    this.piece.position.set(
      lerp(this.from.x, this.to.x, eased),
      // a little hop along the way
      lerp(this.from.y, this.to.y, eased) + Math.sin(Math.PI * t) * 0.4 * this.scale,
      lerp(this.from.z, this.to.z, eased),
    );
    if (t >= 1) {
      this.piece.position.copy(this.to);
      this.phase = "done";
      this.playHit();
      return true;
    }
    return false;
  }

  private playHit(): void {
    if (!this.sound) return;
    try {
      this.sound.currentTime = 0;
      void this.sound.play();
    } catch {
      // autoplay blocked — ignore
    }
  }

  orientToOutcome(): void {
    if (!this.piece) return;
    this.piece.position.copy(this.cellWorld(this.outcome));
    this.phase = "done";
  }

  dispose(): void {
    if (this.ctx) {
      for (const tile of this.tiles) {
        this.ctx.scene.remove(tile);
        disposeObjectTree(tile);
      }
      if (this.originRing) {
        this.ctx.scene.remove(this.originRing);
        disposeObjectTree(this.originRing);
      }
      if (this.piece) {
        this.ctx.scene.remove(this.piece);
        disposeObjectTree(this.piece);
      }
    }
    if (this.sound) {
      this.sound.pause();
      this.sound.src = "";
    }
    this.tiles.length = 0;
    this.originRing = null;
    this.piece = null;
    this.ctx = null;
    this.sound = null;
  }
}

export function boardFactory(props: DeviceProps): Device {
  return new BoardDevice(props as BoardDeviceProps);
}
