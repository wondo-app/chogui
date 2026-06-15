// Recursively dispose Three.js resources (geometries, materials, textures) held by
// an Object3D subtree. Call this before removing a group from the scene to avoid
// leaking GPU memory on repeated mount/dispose cycles.

import type { Object3D } from "three";

const _disposed = new WeakSet<object>();

/** Dispose a single object's geometry and materials (including textures). */
function disposeMeshResources(obj: Object3D): void {
  const mesh = obj as import("three").Mesh;
  if (mesh.isMesh) {
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat || _disposed.has(mat)) continue;
      _disposed.add(mat);
      // Dispose all texture properties on the material
      for (const key of Object.keys(mat)) {
        const val = (mat as unknown as Record<string, unknown>)[key];
        if (val && typeof val === "object" && "dispose" in val && typeof (val as { dispose: unknown }).dispose === "function") {
          (val as { dispose: () => void }).dispose();
        }
      }
      mat.dispose();
    }
  }
}

/**
 * Recursively walk an Object3D subtree and dispose all geometries, materials,
 * and textures. Safe to call on groups, meshes, lights, etc. — non-mesh nodes
 * are traversed but produce no disposal calls.
 */
export function disposeObjectTree(root: Object3D): void {
  root.traverse((child) => {
    disposeMeshResources(child);
  });
}
