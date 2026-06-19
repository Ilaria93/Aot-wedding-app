import type { SceneTimeline } from '@/types/sceneTimeline';
import { assertValidSceneTimeline } from '@/cinematic/timeline/sceneTimeline';
import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPERATION_RAVENNA_TITAN_CORRIDOR_END,
  OPERATION_RAVENNA_WALL_LAUNCH_END,
  OPERATION_RAVENNA_WALLS_APPROACH_END,
} from '@/constants/operationRavennaOpening';

/** Default Operation Ravenna scene windows mapped to normalized scroll progress. */
export const OPERATION_RAVENNA_TIMELINE: SceneTimeline = {
  scenes: [
    { id: 'streetOpening', start: 0, end: OPERATION_RAVENNA_GROUND_SPRINT_END },
    { id: 'rooftops', start: OPERATION_RAVENNA_GROUND_SPRINT_END, end: OPERATION_RAVENNA_ROOFTOPS_END },
    { id: 'wallsApproach', start: OPERATION_RAVENNA_ROOFTOPS_END, end: OPERATION_RAVENNA_WALLS_APPROACH_END },
    { id: 'wallLaunch', start: OPERATION_RAVENNA_WALLS_APPROACH_END, end: OPERATION_RAVENNA_WALL_LAUNCH_END },
    { id: 'titanCorridor', start: OPERATION_RAVENNA_WALL_LAUNCH_END, end: OPERATION_RAVENNA_TITAN_CORRIDOR_END },
    { id: 'coupleStrike', start: OPERATION_RAVENNA_TITAN_CORRIDOR_END, end: 0.93 },
    { id: 'countdownTransition', start: 0.93, end: 1 },
  ],
};

if (__DEV__) {
  assertValidSceneTimeline(OPERATION_RAVENNA_TIMELINE);
}
