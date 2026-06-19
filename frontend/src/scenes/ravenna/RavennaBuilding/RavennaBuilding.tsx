import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { RAVENNA_HOUSE_SMALL_GLB } from '@/scenes/ravenna/ravennaHouseSmallAsset';
import type { RavennaBuildingProps } from '@/scenes/ravenna/RavennaBuilding/types/RavennaBuildingProps';

function resolveScale(scale: RavennaBuildingProps['scale']): [number, number, number] {
  if (scale === undefined) {
    return [1, 1, 1];
  }

  if (typeof scale === 'number') {
    return [scale, scale, scale];
  }

  return scale;
}

/** Clones the cached GLB scene so each instance keeps independent transforms. */
function cloneBuildingScene(source: Object3D): Object3D {
  const clone = SkeletonUtils.clone(source);
  clone.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
    }
  });
  return clone;
}

/**
 * Instanced Ravenna modular building — loads `house_small.glb` via drei useGLTF.
 */
export function RavennaBuilding({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RavennaBuildingProps) {
  const { scene } = useGLTF(RAVENNA_HOUSE_SMALL_GLB);
  const clonedScene = useMemo(() => cloneBuildingScene(scene), [scene]);

  return (
    <group
      name="ravenna-building"
      position={position}
      rotation={rotation}
      scale={resolveScale(scale)}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload(RAVENNA_HOUSE_SMALL_GLB);
