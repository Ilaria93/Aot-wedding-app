import { ContactShadows, Environment } from '@react-three/drei';
import { useMemo } from 'react';

import { CameraRig } from '@/components/cinematic/CameraRig';
import {
  getCinematicSceneModelEntry,
} from '@/constants/cinematicModelRegistry';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import { HeroSceneAtmosphere } from '@/scenes/models/HeroSceneAtmosphere';
import { OperationRavennaScenes } from '@/scenes/models/OperationRavennaScenes';
import { CoupleStrikeSequence } from '@/scenes/sequences/CoupleStrikeSequence';
import type { SceneManagerProps } from '@/types/scene';
import { isCoupleStrikeSceneActive } from '@/utils/coupleStrikeSequence';
import { HERO_CAMERA_TIMELINE } from '@/utils/heroCameraTimeline';
import { resolveCinematicModelSceneId } from '@/utils/sceneModelVisibility';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

/**
 * Root 3D scene for the cinematic hero — GLTF environments, fallbacks and scroll-driven content.
 */
export function SceneManager({ progress = 0 }: SceneManagerProps) {
  const sceneState = useMemo(
    () => resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, progress),
    [progress],
  );
  const modelSceneId = resolveCinematicModelSceneId(sceneState.sceneId);
  const sceneModelEntry = getCinematicSceneModelEntry(modelSceneId);
  const showCoupleStrike = useMemo(() => isCoupleStrikeSceneActive(progress), [progress]);

  return (
    <>
      <CameraRig progress={progress} timeline={HERO_CAMERA_TIMELINE} />

      <HeroSceneAtmosphere progress={progress} />

      <directionalLight
        castShadow
        intensity={1.1}
        position={[5, 12, 2]}
        color="#9aaea0"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-2}
      />

      <Environment preset="sunset" />

      {sceneModelEntry ? (
        <OperationRavennaScenes activeSceneId={sceneState.sceneId} entry={sceneModelEntry} />
      ) : null}

      {showCoupleStrike ? <CoupleStrikeSequence globalProgress={progress} /> : null}

      <ContactShadows
        position={[0, 0.01, 7]}
        opacity={0.35}
        scale={24}
        blur={2.5}
        far={10}
      />
    </>
  );
}
