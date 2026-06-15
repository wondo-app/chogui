// choui lazy-imports `choui-three`, which is published as TypeScript source. A
// `tsc --noEmit` of choui therefore compiles choui-three's source, whose engine
// imports bundler-resolved asset URLs (`*.webp?url`, `*.mp3?url`, `*.glb`). Those
// are ambient module shapes a bundler (Vite/esbuild) fills at build time; in a
// host app the host's client types declare them. Here choui must declare them so
// its own typecheck of the followed choui-three source resolves. Mirror of
// choui-three/src/assets.d.ts.
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
