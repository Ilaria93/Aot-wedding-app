import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Mesh, type Group, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { TITAN_MODELS } from '@/constants/modelRegistry';
import type { TitanPreviewModelId } from '@/constants/titanPreviewAssets';
import { TITAN_PREVIEW_MODELS } from '@/constants/titanPreviewAssets';
import { preloadReadyModel } from '@/scenes/models/modelPreload';
import { normalizeOpaqueCharacterMaterials } from '@/scenes/models/gltfMaterial';

type TitanPreviewModelProps = {
  modelId: TitanPreviewModelId;
  scale: [number, number, number];
  activeAnimation: string | null;
  onAnimationsReady: (names: string[]) => void;
};

function clonePreviewScene(source: Object3D): Object3D {
  const clone = SkeletonUtils.clone(source);
  normalizeOpaqueCharacterMaterials(clone);
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
 * Loads an Ironwolf GLB and drives its animation clips via drei useAnimations.
 */
export function TitanPreviewModel({
  modelId,
  scale,
  activeAnimation,
  onAnimationsReady,
}: TitanPreviewModelProps) {
  const groupRef = useRef<Group>(null);
  const modelSource = TITAN_PREVIEW_MODELS[modelId];
  const { scene, animations } = useGLTF(modelSource);
  const clonedScene = useMemo(() => clonePreviewScene(scene), [scene]);
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    onAnimationsReady(names);
  }, [names, onAnimationsReady]);

  useEffect(() => {
    for (const name of names) {
      actions[name]?.stop();
    }

    const clipName = activeAnimation ?? names[0];

    if (!clipName) {
      return;
    }

    const action = actions[clipName];
    action?.reset().fadeIn(0.2).play();
  }, [actions, activeAnimation, names]);

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

preloadReadyModel(TITAN_MODELS.bullTerrierTitan);
preloadReadyModel(TITAN_MODELS.bullTerrierCharacter);
