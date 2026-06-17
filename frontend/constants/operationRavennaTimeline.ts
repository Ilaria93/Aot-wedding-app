import type { SceneTimeline } from '@/types/sceneTimeline';
import { assertValidSceneTimeline } from '@/utils/sceneTimeline';

/** Default Operation Ravenna scene windows mapped to normalized scroll progress. */
export const OPERATION_RAVENNA_TIMELINE: SceneTimeline = {
  scenes: [
    { id: 'rooftops', start: 0, end: 0.28 },
    { id: 'wallsApproach', start: 0.28, end: 0.42 },
    { id: 'wallLaunch', start: 0.42, end: 0.52 },
    { id: 'titanCorridor', start: 0.52, end: 0.72 },
    { id: 'coupleStrike', start: 0.72, end: 0.84 },
    { id: 'countdownTransition', start: 0.84, end: 1 },
  ],
};

if (__DEV__) {
  assertValidSceneTimeline(OPERATION_RAVENNA_TIMELINE);
}
