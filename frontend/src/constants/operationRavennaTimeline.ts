import type { SceneTimeline } from '@/types/sceneTimeline';
import { assertValidSceneTimeline } from '@/cinematic/timeline/sceneTimeline';

/** Default Operation Ravenna scene windows mapped to normalized scroll progress. */
export const OPERATION_RAVENNA_TIMELINE: SceneTimeline = {
  scenes: [
    { id: 'streetOpening', start: 0, end: 0.09 },
    { id: 'rooftops', start: 0.09, end: 0.42 },
    { id: 'wallsApproach', start: 0.42, end: 0.53 },
    { id: 'wallLaunch', start: 0.53, end: 0.6 },
    { id: 'titanCorridor', start: 0.6, end: 0.84 },
    { id: 'coupleStrike', start: 0.84, end: 0.93 },
    { id: 'countdownTransition', start: 0.93, end: 1 },
  ],
};

if (__DEV__) {
  assertValidSceneTimeline(OPERATION_RAVENNA_TIMELINE);
}
