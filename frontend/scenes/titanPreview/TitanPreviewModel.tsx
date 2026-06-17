import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';

import type { TitanPreviewModelId } from '@/constants/titanPreviewAssets';
import { TITAN_PREVIEW_MODELS } from '@/constants/titanPreviewAssets';

type TitanPreviewModelProps = {
  modelId: TitanPreviewModelId;
  scale: [number, number, number];
  activeAnimation: string | null;
  onAnimationsReady: (names: string[]) => void;
};

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
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(TITAN_PREVIEW_MODELS.mergedAnimations);
useGLTF.preload(TITAN_PREVIEW_MODELS.character);
