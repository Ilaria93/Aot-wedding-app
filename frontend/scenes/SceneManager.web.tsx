import { ContactShadows, Environment } from '@react-three/drei';
import { useMemo } from 'react';

import { CameraPathEditorHelpers } from '@/components/cinematic/CameraPathEditorHelpers';
import { CameraRig } from '@/components/cinematic/CameraRig';
import {
  getCinematicSceneModelEntry,
} from '@/constants/cinematicModelRegistry';
import { isOperationRavennaGrayboxEnabled } from '@/constants/operationRavennaGraybox';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import { GrayboxHeroAtmosphere } from '@/scenes/graybox/GrayboxHeroAtmosphere';
import { OperationRavennaGrayboxWorld } from '@/scenes/graybox/OperationRavennaGrayboxWorld';
import { HeroSceneAtmosphere } from '@/scenes/models/HeroSceneAtmosphere';
import { OperationRavennaScenes } from '@/scenes/models/OperationRavennaScenes';
import { CoupleStrikeSequence } from '@/scenes/sequences/CoupleStrikeSequence';
import { SquadTraversalSequence } from '@/scenes/sequences/SquadTraversalSequence';
import type { SceneManagerProps } from '@/types/scene';
import { isCoupleStrikeSceneActive } from '@/utils/coupleStrikeSequence';
import { HERO_CAMERA_TIMELINE } from '@/utils/heroCameraTimeline';
import { resolveCinematicModelSceneId } from '@/utils/sceneModelVisibility';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

/**
 * Root 3D scene for the cinematic hero — GLTF environments, fallbacks and scroll-driven content.
 */
export function SceneManager({
  progress = 0,
  progressRef,
  cameraDebugRef,
  showCameraPathHelpers = false,
}: SceneManagerProps) {
  const sceneState = useMemo(
    () => resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, progress),
    [progress],
  );
  const modelSceneId = resolveCinematicModelSceneId(sceneState.sceneId);
  const sceneModelEntry = getCinematicSceneModelEntry(modelSceneId);
  const showCoupleStrike = useMemo(() => isCoupleStrikeSceneActive(progress), [progress]);
  const grayboxEnabled = isOperationRavennaGrayboxEnabled();

  return (
    <>
      <CameraRig
        progress={progress}
        progressRef={progressRef}
        cameraDebugRef={cameraDebugRef}
        timeline={HERO_CAMERA_TIMELINE}
      />

      <CameraPathEditorHelpers visible={showCameraPathHelpers} />

      {grayboxEnabled ? (
        <GrayboxHeroAtmosphere />
      ) : (
        <HeroSceneAtmosphere progress={progress} />
      )}

      <directionalLight
        castShadow
        intensity={grayboxEnabled ? 0.85 : 1.1}
        position={grayboxEnabled ? [40, 60, 30] : [5, 12, 2]}
        color={grayboxEnabled ? '#ffffff' : '#9aaea0'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={grayboxEnabled ? 400 : 40}
        shadow-camera-left={grayboxEnabled ? -80 : -12}
        shadow-camera-right={grayboxEnabled ? 80 : 12}
        shadow-camera-top={grayboxEnabled ? 80 : 14}
        shadow-camera-bottom={grayboxEnabled ? -80 : -2}
      />

      {grayboxEnabled ? (
        <OperationRavennaGrayboxWorld />
      ) : (
        <>
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
      )}

      <SquadTraversalSequence globalProgress={progress} />
    </>
  );
}
