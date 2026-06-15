# Contributing a device to chogui-three

A **device** is a self-contained 3D game prop (spintop, board, dice, …) that
animates onto a **predetermined outcome**. The host decides the value *before* the
device mounts; the animation only settles toward it. This is the core invariant:
the displayed outcome must be correct by construction and never depend on the
physics/tween succeeding — so every device also has an instant, no-animation path
for reduced motion and WebGL fallback.

## The contract

A device implements `Device<TOutcome>` (`src/devices/types.ts`):

```ts
export interface Device<TOutcome = unknown> {
  readonly kind: string;        // stable id, e.g. "spintop"
  readonly outcome: TOutcome;   // resolved from props in the constructor
  mount(ctx: DeviceContext): void;   // add meshes/bodies to the scene/world
  update(dtMs: number): boolean;     // advance one frame; return true once settled
  settle(): void;                    // begin the animation toward `outcome`
  orientToOutcome(): void;           // instantly show `outcome` (reduced motion / fallback)
  onSelect?(cb: (index: number) => void): void; // choice devices only (e.g. board)
  dispose(): void;                   // remove everything you added
}
```

Props extend the shared base `DeviceProps` (`scale`, `theme`, `sound`, `reveal`,
`assetPath`, `strength`, `immediate`) — **extend it, don't redeclare its fields**:

```ts
export interface MyDeviceProps extends DeviceProps {
  value: number;       // the predetermined outcome
  labels: string[];
}
```

`DeviceContext` is what the `Stage` hands you at mount:

- `scene` — the shared `three.Scene`; add/remove your meshes here.
- `requestWorld()` — lazily create/return the shared `cannon-es` world (physics
  devices only; tween devices never call it).
- `now()` — monotonic ms time source.
- `registerPick(object, onPick)` — make an object clickable (the Stage raycasts
  pointer events); auto-settling devices ignore it.

## A minimal device

```ts
import { Mesh, BoxGeometry, MeshStandardMaterial } from "three";
import type { Device, DeviceContext, DeviceProps } from "chogui-three";

export interface FlipDeviceProps extends DeviceProps {
  value: number; // 0 or 1
}

export class FlipDevice implements Device<number> {
  readonly kind = "flip";
  readonly outcome: number;
  private mesh: Mesh | null = null;
  private ctx: DeviceContext | null = null;
  private done = false;

  constructor(props: FlipDeviceProps) {
    this.outcome = props.value ? 1 : 0; // resolve the outcome up front
  }

  mount(ctx: DeviceContext): void {
    this.ctx = ctx;
    this.mesh = new Mesh(new BoxGeometry(1, 0.1, 1), new MeshStandardMaterial());
    ctx.scene.add(this.mesh);
    this.orientToOutcome(); // show the correct face immediately by default
  }

  settle(): void { this.done = false; /* start your animation */ }

  update(_dtMs: number): boolean {
    // animate toward `this.outcome`; return true when at rest.
    this.done = true;
    return this.done;
  }

  orientToOutcome(): void {
    if (this.mesh) this.mesh.rotation.x = this.outcome ? 0 : Math.PI;
    this.done = true;
  }

  dispose(): void {
    if (this.mesh && this.ctx) this.ctx.scene.remove(this.mesh);
    this.mesh = null;
    this.ctx = null;
  }
}
```

## Wiring it up

The barrel has **no import side effects** — devices are not auto-registered. Use
your device either way:

```ts
import { Stage, registerDevice, createDevice } from "chogui-three";
import { FlipDevice } from "./FlipDevice";

// Direct (what chogui's tags do):
const device = new FlipDevice({ value });
stage.add(device);

// Or via the opt-in string registry (handy for data-driven kinds):
registerDevice("flip", (props) => new FlipDevice(props as FlipDeviceProps));
const d = createDevice("flip", { value }); // null if the kind isn't registered
```

## Rules of the road

- **Outcome is predetermined.** Resolve it in the constructor from `props.value`.
  The animation may *never* decide or change it. `orientToOutcome()` is the truth;
  `settle()`/`update()` are decoration that must converge to the same pose.
- **Degrade gracefully.** No throwing when WebGL/assets fail — the host renders a
  non-3D fallback that still performs the device's function.
- **Clean up in `dispose()`.** Remove every mesh/body/event listener you added;
  guard async loads against disposal (`if (this.ctx !== ctx) return;` after an
  `await`).
- **Assets.** Prefer bundler `?url` imports for assets you ship with the device
  (Vite/webpack resolve them automatically). For a device whose assets are served
  from a directory, use `resolveAssetPath()` — explicit `assetPath` prop → host
  default (`/assets/chogui-three/`) → jsDelivr CDN fallback.
- **Tests.** Keep outcome/geometry/layout math in pure functions (e.g.
  `outcome.ts`, `layout.ts`) with `*.test.ts` beside them; the root `vitest` run
  picks them up. WebGL itself isn't verifiable headless — exercise it in a Ladle
  story in the host package.
