import { Mesh, type Object3D } from 'three';

/** Returns true when the object graph contains at least one renderable mesh. */
export function sceneHasRenderableMeshes(root: Object3D): boolean {
  let hasMesh = false;

  root.traverse((child) => {
    if (child instanceof Mesh) {
      hasMesh = true;
    }
  });

  return hasMesh;
}
