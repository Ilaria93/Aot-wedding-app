import type { SceneTimeline } from '@/types/sceneTimeline';
import { assertValidSceneTimeline } from '@/utils/sceneTimeline';

/** Default Operation Ravenna scene windows mapped to normalized scroll progress. */
export const OPERATION_RAVENNA_TIMELINE: SceneTimeline = {
  scenes: [
    { id: 'rooftops', start: 0, end: 0.25 },
    { id: 'wallsApproach', start: 0.25, end: 0.4 },
    { id: 'wallLaunch', start: 0.4, end: 0.5 },
    { id: 'titanCorridor', start: 0.5, end: 0.8 },
    { id: 'coupleStrike', start: 0.8, end: 0.95 },
    { id: 'countdownTransition', start: 0.95, end: 1 },
  ],
};

if (__DEV__) {
  assertValidSceneTimeline(OPERATION_RAVENNA_TIMELINE);
}
