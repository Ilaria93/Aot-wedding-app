import type { Object3D } from 'three';
import { Material, Mesh } from 'three';

/**
 * Disposes GPU resources owned by a cloned Object3D tree.
 * Does not clear the shared `useGLTF` cache — call `clearCinematicModelCache` for that.
 */
export function disposeObject3D(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    node.geometry.dispose();

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (material instanceof Material) {
        material.dispose();
      }
    }
  });
}
