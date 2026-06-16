import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector3 } from 'three';

import type { CameraTimeline, NormalizedProgress } from '@/types/cameraRig';
import { assertValidCameraTimeline, resolveCameraPose } from '@/utils/cameraRig';
import { updateCameraMotion } from '@/utils/cameraMotion';

export type CameraRigProps = {
  /** Global scroll progress in the range [0, 1]. */
  progress: NormalizedProgress;
  /** Ordered spline segments defining camera motion over the scroll timeline. */
  timeline: CameraTimeline;
};

/**
 * Scroll-driven camera rig for React Three Fiber.
 * Interpolates camera position and lookAt target along Catmull-Rom spline pairs.
 */
export function CameraRig({ progress, timeline }: CameraRigProps) {
  const { camera } = useThree();
  const pose = useMemo(
    () => ({
      position: new Vector3(),
      target: new Vector3(),
    }),
    [],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      assertValidCameraTimeline(timeline);
    }
  }, [timeline]);

  useFrame((_, delta) => {
    resolveCameraPose(timeline, progress, pose);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    updateCameraMotion(camera.position, delta);
  });

  return null;
}
