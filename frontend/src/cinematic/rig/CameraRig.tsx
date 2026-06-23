import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';

import { AERIAL_ODM_CAMERA_LEGS } from '@/data/odmCameraAnchors';
import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';
import type { CameraTimeline, NormalizedProgress } from '@/types/cameraRig';
import { assertValidCameraTimeline } from '@/cinematic/camera/cameraRig';
import {
  cameraMotionState,
  resetCameraMotionTracking,
  setGrappleMotionPhase,
  updateCameraMotion,
} from '@/cinematic/camera/cameraMotion';
import {
  DEFAULT_ODM_CAMERA_TUNING,
  assertValidOdmCameraLegs,
  resolveOdmVelocityFov,
} from '@/cinematic/camera/odmCameraMotion';
import { TITAN_CORRIDOR_ODM_TUNING } from '@/cinematic/camera/heroSegmentOdmMotion';
import { isTitanCorridorOdmPhase } from '@/cinematic/camera/heroSegmentOdmMotion';
import {
  isAerialTraversalPhase,
  resolveHeroCameraPose,
  isStaticOpeningFrame,
} from '@/cinematic/camera/openingCameraMotion';

export type CameraRigProps = {
  /** Global scroll progress in the range [0, 1]. */
  progress: NormalizedProgress;
  /** High-frequency progress ref read every frame (web scroll scrub). */
  progressRef?: RefObject<number>;
  /** Optional dev snapshot ref updated every frame with camera pose. */
  cameraDebugRef?: RefObject<CinematicCameraDebugSnapshot>;
  /** Ordered spline segments — kept for dev validation and path editor helpers. */
  timeline: CameraTimeline;
};

/**
 * Scroll-driven camera rig with ODM grapple momentum — pull, release, gravity, roll and speed FOV.
 */
export function CameraRig({ progress, progressRef, cameraDebugRef, timeline }: CameraRigProps) {
  const { camera } = useThree();
  const pose = useMemo(
    () => ({
      position: new Vector3(),
      target: new Vector3(),
      roll: 0,
      fov: DEFAULT_ODM_CAMERA_TUNING.baseFov,
      phase: 'release' as const,
    }),
    [],
  );
  const wasStaticRef = useRef(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      assertValidCameraTimeline(timeline);
      assertValidOdmCameraLegs(AERIAL_ODM_CAMERA_LEGS);
    }
  }, [timeline]);

  useFrame((_, delta) => {
    const activeProgress = progressRef?.current ?? progress;
    const isStatic = isStaticOpeningFrame(activeProgress);

    if (isStatic && !wasStaticRef.current) {
      resetCameraMotionTracking();
    }

    wasStaticRef.current = isStatic;

    resolveHeroCameraPose(activeProgress, pose);
    setGrappleMotionPhase(
      typeof pose.phase === 'string' && pose.phase !== 'walk' && pose.phase !== 'run' && pose.phase !== 'accel'
        ? pose.phase
        : pose.phase === 'walk' || pose.phase === 'run' || pose.phase === 'accel'
          ? 'street'
          : null,
    );
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.rotation.z = 0;
    camera.rotateZ(pose.roll);

    if (isStatic) {
      resetCameraMotionTracking();
    } else {
      updateCameraMotion(camera.position, delta);
    }

    if (camera instanceof PerspectiveCamera) {
      const blend = 1 - Math.exp(-delta * 14);
      const usePoseFovOnly = isAerialTraversalPhase(activeProgress);
      const speedTuning = isTitanCorridorOdmPhase(activeProgress)
        ? TITAN_CORRIDOR_ODM_TUNING
        : DEFAULT_ODM_CAMERA_TUNING;
      const targetFov = usePoseFovOnly
        ? pose.fov
        : Math.max(
            pose.fov,
            resolveOdmVelocityFov(cameraMotionState.speed, speedTuning),
          );

      camera.fov = MathUtils.lerp(camera.fov, targetFov, blend);
      camera.updateProjectionMatrix();
    }

    if (__DEV__ && cameraDebugRef) {
      cameraDebugRef.current.position = [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ];
      cameraDebugRef.current.rotation = [
        MathUtils.radToDeg(camera.rotation.x),
        MathUtils.radToDeg(camera.rotation.y),
        MathUtils.radToDeg(camera.rotation.z),
      ];
    }
  });

  return null;
}
