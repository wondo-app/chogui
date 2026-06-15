// Public barrel for `chogui-three`.
//
// The engine is framework-agnostic vanilla TS. Its host library reaches it only
// through a dynamic `import()` (in a `use3DDevice` hook), so the heavier scene/physics
// modules — and their `three` / `cannon-es` deps — stay out of any host's SSR and
// main bundle. The pure tween + asset-path helpers carry no 3D dependency.
//
// This barrel has NO side effects on import: devices are NOT auto-registered. A host
// either instantiates a device class directly (`new SpinTopDevice(props)`) or opts in
// to the string registry by calling `registerDevice(kind, factory)` before
// `createDevice(kind, props)`. That keeps the barrel tree-shakeable (`sideEffects:
// false`) so a consumer pulls in only the devices it uses.
//
// The forked dice engine is vendored under `src/dice-box/` (see THIRD_PARTY_NOTICES.md)
// and normalized onto the `Stage` + `Device` contract via `DiceDevice`.

export * from "./engine/tween";
export * from "./engine/assets";
export * from "./engine/stage";
export * from "./engine/colorsets";
export * from "./engine/surface-texture";
export * from "./devices/types";
export { makeCoinFaceTexture, readCssFont } from "./engine/face-texture";
export * from "./devices/board/layout";
export { BoardDevice, boardFactory } from "./devices/board/BoardDevice";
export * from "./devices/spintop/outcome";
export { SpinTopDevice, spintopFactory } from "./devices/spintop/SpinTopDevice";
export type { DiceResult, DiceDeviceProps } from "./devices/dice/DiceDevice";
export { DiceDevice, diceFactory } from "./devices/dice/DiceDevice";
