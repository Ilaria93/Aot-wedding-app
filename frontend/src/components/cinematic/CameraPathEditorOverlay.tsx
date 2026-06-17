import type { RefObject } from 'react';

import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';

type CameraPathEditorOverlayProps = {
  visible: boolean;
  progressRef: RefObject<number>;
  cameraDebugRef: RefObject<CinematicCameraDebugSnapshot>;
};

/** Native stub — camera path editor overlay is web-only. */
export function CameraPathEditorOverlay(_props: CameraPathEditorOverlayProps) {
  return null;
}
