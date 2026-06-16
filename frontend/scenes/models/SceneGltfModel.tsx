import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Mesh, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import type { CinematicSceneModelEntry, GltfTransform } from '@/constants/cinematicModelRegistry';
import type { LoadedSceneGltf } from '@/scenes/models/preloadCinematicModels';

import '@/scenes/models/dracoLoader';

type SceneGltfModelProps = {
  entry: CinematicSceneModelEntry;
  visible: boolean;
  onLoaded?: () => void;
};

function resolveScale(scale: GltfTransform['scale']): [number, number, number] {
  if (scale === undefined) {
    return [1, 1, 1];
  }

  if (typeof scale === 'number') {
    return [scale, scale, scale];
  }

  return scale;
}

function asGltfPath(source: CinematicSceneModelEntry['source']): string {
  return source as unknown as string;
}

/** Clones a GLTF scene for safe attachment without mutating cached read-only transforms. */
function cloneSceneForRender(source: Object3D): Object3D {
  const clone = SkeletonUtils.clone(source);
  clone.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return clone;
}

/**
 * Loads a scene GLTF via drei and renders a cloned instance attached with primitive.
 */
export function SceneGltfModel({ entry, visible, onLoaded }: SceneGltfModelProps) {
  const { scene } = useGLTF(asGltfPath(entry.source), entry.useDraco) as LoadedSceneGltf;
  const clonedScene = useMemo(() => cloneSceneForRender(scene), [scene]);
  const { position = [0, 0, 0], rotation = [0, 0, 0], scale } = entry.transform;

  useEffect(() => {
    onLoaded?.();
  }, [clonedScene, onLoaded]);

  if (!visible) {
    return null;
  }

  return (
    <group
      name={`gltf-${entry.sceneId}`}
      position={position}
      rotation={rotation}
      scale={resolveScale(scale)}>
      <primitive object={clonedScene} />
    </group>
  );
}
