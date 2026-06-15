// Surface textures shared by devices that support a visual surface overlay
// (board piece, spintop faces). The `.webp` set is vendored under assets/textures,
// imported via Vite `?url` so the host serves them without an asset-copy step.
// Composited (multiply) over the face's base color, like a die's grain.

import astralUrl from "../../assets/textures/astral.webp?url";
import cloudyUrl from "../../assets/textures/cloudy.webp?url";
import dragonUrl from "../../assets/textures/dragon.webp?url";
import fireUrl from "../../assets/textures/fire.webp?url";
import glitterUrl from "../../assets/textures/glitter.webp?url";
import iceUrl from "../../assets/textures/ice.webp?url";
import leopardUrl from "../../assets/textures/leopard.webp?url";
import marbleUrl from "../../assets/textures/marble.webp?url";
import metalUrl from "../../assets/textures/metal.webp?url";
import paperUrl from "../../assets/textures/paper.webp?url";
import skullsUrl from "../../assets/textures/skulls.webp?url";
import specklesUrl from "../../assets/textures/speckles.webp?url";
import starsUrl from "../../assets/textures/stars.webp?url";
import stoneUrl from "../../assets/textures/stone.webp?url";
import waterUrl from "../../assets/textures/water.webp?url";
import woodUrl from "../../assets/textures/wood.webp?url";

const SURFACE_URLS: Record<string, string> = {
  paper: paperUrl,
  marble: marbleUrl,
  speckles: specklesUrl,
  stone: stoneUrl,
  wood: woodUrl,
  metal: metalUrl,
  glitter: glitterUrl,
  stars: starsUrl,
  astral: astralUrl,
  water: waterUrl,
  ice: iceUrl,
  fire: fireUrl,
  cloudy: cloudyUrl,
  dragon: dragonUrl,
  leopard: leopardUrl,
  skulls: skullsUrl,
};

/** The available surface texture names (excludes the implicit `none`). */
export const SURFACE_NAMES = Object.keys(SURFACE_URLS);

/** Load a surface texture image by name; resolves null for `none`/unknown/SSR/error. */
export function loadSurface(name?: string): Promise<HTMLImageElement | null> {
  const url = name && name !== "none" ? SURFACE_URLS[name] : undefined;
  if (!url || typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
