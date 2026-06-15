// `[spintop]` device — an N-sided spinning top (teetotum, even sides: 4 or 6), driven by a
// cannon-es solver. It starts ON the ground spinning upright (no drop), then — balanced on
// its narrow base with no gyroscopic support — tips and topples onto a labeled side, where
// it settles and STAYS. Wood clacks on contact.
//
// It is purely decorative: it does NOT relabel or reorient to present the winner (that
// "face change on land" read wrong). The Ink-decided value is shown by the story itself.
// Reduced-motion is the one exception — with no tumble to watch, the static pose leans the
// winning face forward. Geometry comes from the shared `buildTeetotum`; faces show text
// labels (or numbers); an optional surface texture loads async and swaps in.
//
// PHYSICS NOTE — the upright spin is a FAKE gyroscope: cannon-es models no angular
// momentum, so a spinning top would just fall over at once. `update()` instead applies a
// fading righting torque for UPRIGHT_MS, then kicks the topple (see the long comment
// there). This is intentional and works only because the outcome is predetermined and the
// tumble is decorative — do NOT mistake it for a real gyroscope when extending this device.

import { Group, Quaternion, Vector3 } from "three";
import { Body, Cylinder, Sphere, Vec3 } from "cannon-es";

import wood1Url from "../../../assets/sounds/dicehit/dicehit_wood1.mp3?url";
import wood3Url from "../../../assets/sounds/dicehit/dicehit_wood3.mp3?url";
import { WONDO_COLORSETS } from "../../engine/colorsets";
import { disposeObjectTree } from "../../engine/dispose-utils";
import type { Device, DeviceContext, DeviceProps } from "../types";
import {
  BODY_H,
  POINT_H,
  RADIUS,
  STEM_H,
  STEM_R,
  STUB_R,
  TOP_CHAMFER_H,
  buildTeetotum,
  evenSides,
} from "./geometry";
import { resolveSegmentIndex } from "./outcome";
import { loadSurface } from "../../engine/surface-texture";

export interface SpinTopDeviceProps extends DeviceProps {
  /** Winning face index (decided by the host). Only used for the reduced-motion pose. */
  value: number;
  /** Face labels; a face with no label shows its number. */
  actions: string[];
  sides?: number;
  texture?: string;
  /** Named colorway (bone, ink, sage, amber, coral, sky). */
  color?: string;
}

const SETTLE_MS = 2600; // cap the spin/topple before we force a settle
const SPIN_SPEED = 12; // upright spin (rad/s) it starts with; a small random extra is added
const UPRIGHT_MS = 60; // how long the fake-gyro holds it upright before it topples
const GRAVITY = 30; // Stage world gravity magnitude (used to size the righting couple)
const COM_OFFSET = 0.28; // raise the COM toward the handle — a big, slow topple, not a flat flop
const GYRO_MARGIN = 1; // how firmly the fake-gyro beats gravity while it holds upright
const TOPPLE_KICK = 2; // angular-velocity nudge (rad/s) that starts the topple at release
const HIT_COOLDOWN_MS = 90; // min gap between wood clacks
const TWO_PI = Math.PI * 2;
const Y_AXIS = new Vector3(0, 1, 0);

type Phase = "tumbling" | "done";

export class SpinTopDevice implements Device<number> {
  readonly kind = "spintop";
  readonly outcome: number;
  private readonly count: number;
  private readonly labels: string[];
  private readonly scale: number;
  private readonly soundOn: boolean;
  private readonly texture?: string;
  private readonly bodyColor: string;
  private readonly labelColor: string;
  private readonly standY: number; // upright resting height (base tip on the floor)
  private top: Group | null = null;
  private body: Body | null = null;
  private ctx: DeviceContext | null = null;
  private phase: Phase = "done";
  private elapsed = 0;
  private lastHit = 0;
  private toppled = false; // whether the topple kick has fired (once, when the gyro releases)
  private toppleAngle = 0; // random horizontal direction to topple toward
  private sounds: HTMLAudioElement[] = [];
  private onCollide: (() => void) | null = null;
  // Scratch vectors reused every frame to avoid GC pressure during the tumble.
  private readonly _scratchUp = new Vector3();
  private readonly _scratchAxis = new Vector3();
  private readonly _scratchQuat = new Quaternion();

  constructor(props: SpinTopDeviceProps) {
    this.count = evenSides(props.sides ?? props.actions.length);
    this.labels = Array.from({ length: this.count }, (_, i) => props.actions[i] ?? "");
    this.outcome = resolveSegmentIndex(props.value, this.count);
    this.scale = props.scale ?? 1;
    this.soundOn = props.sound !== false;
    this.texture = props.texture;
    const cs = WONDO_COLORSETS[props.color ?? "bone"] ?? WONDO_COLORSETS.bone!;
    this.bodyColor = cs.background;
    this.labelColor = cs.foreground;
    this.standY = (COM_OFFSET + BODY_H / 2 + POINT_H) * this.scale;
  }

  mount(ctx: DeviceContext): void {
    this.ctx = ctx;
    this.buildVisual(ctx, null);

    if (this.texture && this.texture !== "none") {
      void loadSurface(this.texture).then((img) => {
        if (this.ctx !== ctx || !img) return;
        this.buildVisual(ctx, img); // swap in the textured version once loaded
      });
    }

    const s = this.scale;
    const body = new Body({
      mass: 1,
      position: new Vec3(0, this.standY, 0),
      allowSleep: true,
      sleepSpeedLimit: 0.3,
      sleepTimeLimit: 0.3,
      linearDamping: 0.05,
      angularDamping: 0.06,
    });
    // Collision mirrors the real top in three parts: the body prism (the labeled faces it
    // rests on); a small sphere at the faceted tip (a rounded contact it can't balance on,
    // so it always topples to a side); and the thin handle (keeps it top-heavy, never a cap).
    body.addShape(new Cylinder(RADIUS * s, RADIUS * s, BODY_H * s, this.count), new Vec3(0, -COM_OFFSET * s, 0));
    body.addShape(
      new Sphere(STUB_R * s),
      new Vec3(0, -(COM_OFFSET + BODY_H / 2 + POINT_H - STUB_R) * s, 0),
    );
    body.addShape(
      new Cylinder(STEM_R * s, STEM_R * s, STEM_H * s, 8),
      new Vec3(0, (BODY_H / 2 + TOP_CHAMFER_H + STEM_H / 2 - COM_OFFSET) * s, 0),
    );
    this.onCollide = () => this.playHit();
    body.addEventListener("collide", this.onCollide);
    ctx.requestWorld().addBody(body);
    this.body = body;

    if (this.soundOn && typeof Audio !== "undefined") {
      this.sounds = [wood1Url, wood3Url].map((u) => {
        const a = new Audio(u);
        a.volume = 0.3;
        return a;
      });
    }

    this.orientToOutcome();
  }

  // (Re)build the visual, preserving the current transform — used to swap a neutral top
  // for the textured one once its surface image loads.
  private buildVisual(ctx: DeviceContext, surface: HTMLImageElement | null): void {
    const prev = this.top;
    const group = buildTeetotum(this.count, {
      labels: this.labels,
      surface,
      color: this.bodyColor,
      foreground: this.labelColor,
      comOffset: COM_OFFSET,
    });
    group.scale.setScalar(this.scale);
    if (prev) {
      group.position.copy(prev.position);
      group.quaternion.copy(prev.quaternion);
      ctx.scene.remove(prev);
      disposeObjectTree(prev);
    } else {
      group.position.y = this.standY;
    }
    ctx.scene.add(group);
    this.top = group;
  }

  settle(): void {
    if (!this.body) return;
    this.phase = "tumbling";
    this.elapsed = 0;
    this.toppled = false;
    this.toppleAngle = Math.random() * TWO_PI;
    // Start ON the ground, upright on the base — no drop. A tiny tip breaks the balance so
    // it spins for a beat then topples (inverted-pendulum: slow at first, then over it goes).
    this.body.position.set(0, this.standY, 0);
    this.body.quaternion.setFromEuler((Math.random() - 0.5) * 0.12, 0, (Math.random() - 0.5) * 0.12);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 1.2,
      SPIN_SPEED + Math.random() * 8,
      (Math.random() - 0.5) * 1.2,
    );
    this.body.wakeUp();
  }

  update(dtMs: number): boolean {
    if (this.phase === "done" || !this.top || !this.body) return true;

    this.elapsed += dtMs;
    const p = this.body.position;
    const q = this.body.quaternion;
    this.top.position.set(p.x, p.y, p.z);
    this.top.quaternion.set(q.x, q.y, q.z, q.w);

    // Fake gyroscopic upright assist — cannon has no gyro, so without this a spinning top
    // just falls over at once. This holds it upright (spinning) for a beat, then fades, so
    // it tips, rolls, and topples flat onto a side. The righting torque aligns the body's
    // local up to world up (axis = up × worldUp), eased out over UPRIGHT_MS.
    const gyro = 1 - this.elapsed / UPRIGHT_MS;
    if (gyro > 0) {
      const up = this._scratchUp.set(0, 1, 0).applyQuaternion(this._scratchQuat.set(q.x, q.y, q.z, q.w));
      const axis = this._scratchAxis.crossVectors(up, Y_AXIS); // magnitude = sin(tilt)
      // Righting couple sized to beat gravity's toppling couple (m·g·standY·sinθ) by a
      // fading margin, so it stands and spins upright through UPRIGHT_MS, then releases.
      const k = GRAVITY * this.standY * (1 + GYRO_MARGIN * gyro);
      this.body.applyTorque(new Vec3(axis.x * k, axis.y * k, axis.z * k));
    } else if (!this.toppled) {
      // The gyro rights it to dead-center upright, so on its own it would just balance on
      // the ball forever. Kick it over once, in a random direction, to start the topple.
      this.toppled = true;
      this.body.angularVelocity.x += Math.cos(this.toppleAngle) * TOPPLE_KICK;
      this.body.angularVelocity.z += Math.sin(this.toppleAngle) * TOPPLE_KICK;
    }

    const settled =
      this.body.sleepState === Body.SLEEPING ||
      (this.elapsed > SETTLE_MS && this.body.velocity.length() < 0.3);
    if (settled) {
      // Decorative — leave it exactly where physics dropped it. No relabel, no reorient.
      this.phase = "done";
      return true;
    }
    return false;
  }

  // Static pose for reduced motion / immediate reveal: lie flat on a side with the winning
  // face up, so the overhead camera reads it. (The only path that "presents" the outcome —
  // no tumble to convey it.) Rotates the winning face's outward normal to world up.
  orientToOutcome(): void {
    if (!this.top) return;
    const theta = (this.outcome + 0.5) * (TWO_PI / this.count); // face-center angle
    const axis = new Vector3(-Math.cos(theta), 0, Math.sin(theta)).normalize();
    this.top.quaternion.setFromAxisAngle(axis, Math.PI / 2);
    this.top.position.set(0, RADIUS * Math.cos(Math.PI / this.count) * this.scale, 0);
    this.phase = "done";
  }

  private playHit(): void {
    if (this.sounds.length === 0) return;
    const now = this.ctx?.now() ?? 0;
    if (now - this.lastHit < HIT_COOLDOWN_MS) return;
    this.lastHit = now;
    const a = this.sounds[Math.floor(Math.random() * this.sounds.length)]!;
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      // autoplay blocked / no audio — ignore
    }
  }

  dispose(): void {
    if (this.body && this.onCollide) this.body.removeEventListener("collide", this.onCollide);
    if (this.body && this.ctx) this.ctx.requestWorld().removeBody(this.body);
    if (this.top) {
      if (this.ctx) this.ctx.scene.remove(this.top);
      disposeObjectTree(this.top);
    }
    for (const a of this.sounds) {
      a.pause();
      a.src = "";
    }
    this.top = null;
    this.body = null;
    this.ctx = null;
    this.sounds = [];
    this.onCollide = null;
  }
}

export function spintopFactory(props: DeviceProps): Device {
  return new SpinTopDevice(props as SpinTopDeviceProps);
}
