import type { RefObject } from 'react';

import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';

type OperationRavennaDebugOverlayProps = {
  visible: boolean;
  progressRef: RefObject<number>;
  cameraDebugRef: RefObject<CinematicCameraDebugSnapshot>;
};

/** Native stub — Operation Ravenna debug overlay is web-only. */
export function OperationRavennaDebugOverlay(_props: OperationRavennaDebugOverlayProps) {
  return null;
}
