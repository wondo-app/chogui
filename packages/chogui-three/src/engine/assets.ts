// Resolve the base URL the engine fetches device assets (textures / sounds) from.
// Precedence: an explicit path → the host-vendored default → a CDN fallback so a
// consumer that skipped the copy step still works. Always returns a trailing-slash
// path, so callers can append `textures/<name>.webp` directly.

export const DEFAULT_ASSET_PATH = "/assets/chogui-three/";

// jsDelivr-hosted package assets — the zero-config fallback.
export const CDN_ASSET_PATH =
  "https://cdn.jsdelivr.net/npm/chogui-three/assets/";

export interface ResolveAssetPathOptions {
  /** Use the CDN fallback instead of the host-vendored default. */
  preferCdn?: boolean;
}

export function resolveAssetPath(
  explicit?: string,
  opts: ResolveAssetPathOptions = {},
): string {
  const base =
    explicit?.trim() || (opts.preferCdn ? CDN_ASSET_PATH : DEFAULT_ASSET_PATH);
  return base.endsWith("/") ? base : `${base}/`;
}
