// The device contract every chogui-three device implements, plus a tiny registry.
//
// A "device" is a 3D game prop (dice/coin/spinner/board) that animates onto a
// PREDETERMINED outcome — the value is decided by the host before the device ever
// mounts, and the animation only settles toward it. `orientToOutcome()` is the
// instant, no-animation path (reduced motion / WebGL fallback), so the displayed
// outcome is always correct by construction, never dependent on the physics tumble.

import type { Object3D, Scene } from "three";
import type { World } from "cannon-es";

export type RevealTrigger = "auto" | "click";

// The overlapping prop surface shared by every device; each device extends it.
export interface DeviceProps {
  /** Linear size multiplier in the tray. */
  scale?: number;
  /** Named colorway. */
  theme?: string;
  /** Play settle sounds. */
  sound?: boolean;
  /** When the settle animation plays. */
  reveal?: RevealTrigger;
  /** Animation intensity (toss force / spin turns). */
  strength?: number;
  /** Skip animation; show the outcome immediately (reduced motion / fallback). */
  immediate?: boolean;
}

// What the SceneController hands a device at mount time.
export interface DeviceContext {
  scene: Scene;
  /** Lazily create / return the shared physics world (physics devices only). */
  requestWorld(): World;
  /** Monotonic time source in ms. */
  now(): number;
  /**
   * Register an object as clickable: the Stage raycasts pointer events against the
   * camera and invokes `onPick` when this object (or a descendant) is pressed. Used
   * by interactive devices like `board`; auto-settling devices ignore it.
   */
  registerPick(object: Object3D, onPick: () => void): void;
}

export interface Device<TOutcome = unknown> {
  readonly kind: string;
  readonly outcome: TOutcome;
  /** Add meshes / bodies to the scene / world. */
  mount(ctx: DeviceContext): void;
  /** Advance one frame by `dtMs`; return true once the device has settled. */
  update(dtMs: number): boolean;
  /** Begin the settle animation toward the outcome. */
  settle(): void;
  /** Instantly show the outcome with no animation (reduced motion / fallback). */
  orientToOutcome(): void;
  /** Choice devices (`board`) only: notify when a cell is chosen. */
  onSelect?(cb: (index: number) => void): void;
  dispose(): void;
}

export type DeviceFactory = (props: DeviceProps) => Device;

const registry = new Map<string, DeviceFactory>();

export function registerDevice(kind: string, factory: DeviceFactory): void {
  registry.set(kind, factory);
}

export function createDevice(kind: string, props: DeviceProps): Device | null {
  return registry.get(kind)?.(props) ?? null;
}

export function listDeviceKinds(): string[] {
  return [...registry.keys()];
}

export function hasDevice(kind: string): boolean {
  return registry.has(kind);
}
