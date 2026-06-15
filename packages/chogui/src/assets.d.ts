// chogui lazy-imports `chogui-three`, which is published as TypeScript source. A
// `tsc --noEmit` of chogui therefore compiles chogui-three's source, whose engine
// imports bundler-resolved asset URLs (`*.webp?url`, `*.mp3?url`, `*.glb`). Those
// are ambient module shapes a bundler (Vite/esbuild) fills at build time; in a
// host app the host's client types declare them. Here chogui must declare them so
// its own typecheck of the followed chogui-three source resolves. Mirror of
// chogui-three/src/assets.d.ts.
declare module "*.glb" {
	const url: string;
	export default url;
}
declare module "*.glb?url" {
	const url: string;
	export default url;
}
declare module "*.svg?raw" {
	const markup: string;
	export default markup;
}
declare module "*.mp3?url" {
	const url: string;
	export default url;
}
declare module "*.webp?url" {
	const url: string;
	export default url;
}
