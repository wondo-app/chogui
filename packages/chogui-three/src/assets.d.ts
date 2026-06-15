// Vite asset imports resolve to a URL string at build time.
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
