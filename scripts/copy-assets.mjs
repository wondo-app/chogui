// Catalog-side shim: vendor choui-three's runtime assets into the repo's public/
// dir so the Ladle catalog can fetch them (textures/sounds/models) at the path
// the engine's `resolveAssetPath()` default expects (`/assets/choui-three/`).
//
// choui-three owns its asset distribution; this delegates to the package's own
// copy script, resolved through the workspace. The script reads its source
// relative to its own location, so the same call works from the workspace and
// from an installed node_modules copy.
import "choui-three/scripts/copy-assets.mjs";
