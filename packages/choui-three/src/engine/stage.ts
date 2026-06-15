// The shared 3D stage a device mounts into: one three.js scene + overhead camera +
// lights + renderer, and a lazily-created cannon-es world with a ground plane. A
// single rAF loop steps physics, ticks each device, and renders until every device
// reports settled; an IntersectionObserver pauses it while offscreen. With no rAF
// (SSR / tests) it falls back to an instant `orientToOutcome`, so the value still shows.
//
// This is the seed of the normalized engine: as the vendored `dice-box` is split, the
// dice device will mount into a Stage like the coin does.

import {
  AmbientLight,
  DirectionalLight,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShadowMaterial,
  Mesh,
  Vector2,
  WebGLRenderer,
} from "three";
import { Body, Plane, Vec3, World } from "cannon-es";

import type { Device, DeviceContext } from "../devices/types";

export interface WorldConfig {
  gravity?: Vec3;
  allowSleep?: boolean;
  defaultRestitution?: number;
  defaultFriction?: number;
}

export interface StageOptions {
  width?: number;
  height?: number;
  /** Pause the loop while the container is offscreen (default true). */
  observeVisibility?: boolean;
  /** Camera framing: `overhead` (top-down, default), `angled` (3/4 view, for
   *  upright devices like a spinning top), or `dice` (tight overhead for the
   *  dice tray — narrower FOV, closer camera). */
  view?: "overhead" | "angled" | "dice";
  /** Physics world configuration. Applied once when the world is lazily created. */
  world?: WorldConfig;
  /** Enable soft shadows. `true` for the default subtle look (opacity 0.15);
   *  pass a number to override the shadow opacity. */
  shadow?: boolean | number;
}

const SHADOW_OPACITY = 0.15;

export class Stage implements DeviceContext {
  readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private world: World | null = null;
  private readonly worldConfig?: WorldConfig;
  private readonly devices: Device[] = [];
  private raf = 0;
  private running = false;
  private lastTime = 0;
  private observer: IntersectionObserver | null = null;
  private onAllSettled?: () => void;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly pickables: Array<{ object: Object3D; onPick: () => void }> = [];

  constructor(container: HTMLElement, opts: StageOptions = {}) {
    this.worldConfig = opts.world;
    const width = opts.width ?? container.clientWidth ?? 240;
    const height = opts.height ?? container.clientHeight ?? 240;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

    this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(dpr ?? 1, 2));
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(35, width / height, 0.1, 100);
    if (opts.view === "angled") {
      // 3/4 view: see the upright device's side faces + a little of the top.
      this.camera.position.set(0, 4.2, 6.5);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(0, 0.3, 0);
    } else if (opts.view === "dice") {
      // Dice tray: tight overhead with narrower FOV (20°) for the dice-box look.
      // Camera sits higher to frame the tray without clipping tumbling dice.
      this.camera.fov = 20;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(0, 12, 0);
      this.camera.up.set(0, 0, -1);
      this.camera.lookAt(0, 0, 0);
    } else {
      // Overhead: look straight down the +Y axis at the table (the XZ plane).
      this.camera.position.set(0, 9, 0);
      this.camera.up.set(0, 0, -1);
      this.camera.lookAt(0, 0, 0);
    }

    this.scene.add(new AmbientLight(0xffffff, 0.75));
    const key = new DirectionalLight(0xffffff, 0.5);
    key.position.set(3, 9, 2);
    this.scene.add(key);

    // Shadows: a single soft shadow from the key light onto a transparent ground.
    if (opts.shadow) {
      const opacity = typeof opts.shadow === "number" ? opts.shadow : SHADOW_OPACITY;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = WebGLRenderer !== undefined ? 2 /* PCFSoftShadowMap */ : 0;

      key.castShadow = true;
      key.shadow.mapSize.set(512, 512);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 30;
      key.shadow.camera.left = -4;
      key.shadow.camera.right = 4;
      key.shadow.camera.top = 4;
      key.shadow.camera.bottom = -4;
      key.shadow.bias = -0.002;

      const shadowGround = new Mesh(
        new PlaneGeometry(12, 12),
        new ShadowMaterial({ opacity }),
      );
      shadowGround.rotation.x = -Math.PI / 2;
      shadowGround.position.y = 0.02;
      shadowGround.receiveShadow = true;
      this.scene.add(shadowGround);
    }

    if (
      opts.observeVisibility !== false &&
      typeof IntersectionObserver === "function"
    ) {
      this.observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.resume();
          else this.pause();
        }
      });
      this.observer.observe(container);
    }

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
  }

  now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  registerPick(object: Object3D, onPick: () => void): void {
    this.pickables.push({ object, onPick });
  }

  // Raycast pointer presses against registered objects (shared by interactive
  // devices); resume the loop so the picked device can animate its response.
  private readonly handlePointer = (e: PointerEvent): void => {
    if (this.pickables.length === 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.pickables.map((p) => p.object),
      true,
    );
    if (hits.length === 0) return;
    let obj: Object3D | null = hits[0]!.object;
    while (obj) {
      const match = this.pickables.find((p) => p.object === obj);
      if (match) {
        match.onPick();
        this.resume();
        return;
      }
      obj = obj.parent;
    }
  };

  requestWorld(): World {
    if (!this.world) {
      const wc = this.worldConfig;
      this.world = new World({ gravity: wc?.gravity ?? new Vec3(0, -30, 0) });
      this.world.allowSleep = wc?.allowSleep ?? true;
      this.world.defaultContactMaterial.restitution = wc?.defaultRestitution ?? 0.45;
      this.world.defaultContactMaterial.friction = wc?.defaultFriction ?? 0.25;
      // Ground plane at y=0, rotated to face up (+Y) — cannon planes face +Z by default.
      const ground = new Body({ mass: 0, shape: new Plane() });
      ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      this.world.addBody(ground);
    }
    return this.world;
  }

  add(device: Device): void {
    device.mount(this);
    this.devices.push(device);
  }

  /** Begin the settle animation across all mounted devices. */
  settle(onAllSettled?: () => void): void {
    this.onAllSettled = onAllSettled;
    for (const d of this.devices) d.settle();
    this.run();
  }

  /** Instantly show every device's outcome with no animation. */
  showImmediately(): void {
    for (const d of this.devices) d.orientToOutcome();
    this.renderOnce();
    this.onAllSettled?.();
  }

  private run(): void {
    if (typeof requestAnimationFrame !== "function") {
      this.showImmediately();
      return;
    }
    this.resume();
  }

  private resume(): void {
    if (this.running || typeof requestAnimationFrame !== "function") return;
    this.running = true;
    this.lastTime = this.now();
    const tick = () => {
      if (!this.running) return;
      const t = this.now();
      const dt = t - this.lastTime;
      this.lastTime = t;
      this.world?.step(1 / 60, dt / 1000, 3);
      let allSettled = true;
      for (const d of this.devices) {
        if (!d.update(dt)) allSettled = false;
      }
      this.renderOnce();
      if (allSettled) {
        this.pause();
        this.onAllSettled?.();
      } else {
        this.raf = requestAnimationFrame(tick);
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  private pause(): void {
    this.running = false;
    if (this.raf && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.raf);
    }
    this.raf = 0;
  }

  private renderOnce(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.pause();
    this.observer?.disconnect();
    this.observer = null;
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    this.pickables.length = 0;
    for (const d of this.devices) d.dispose();
    this.devices.length = 0;
    // Clean up the cannon-es world and its ground body.
    if (this.world) {
      for (const body of [...this.world.bodies]) this.world.removeBody(body);
      this.world = null;
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
