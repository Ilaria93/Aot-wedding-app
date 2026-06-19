import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/scenes/models/dracoLoader', () => ({}));

vi.mock('@react-three/drei', () => ({
  useGLTF: {
    preload: vi.fn(),
  },
}));

vi.mock('@/constants/cinematicModelRegistry', () => ({
  getCinematicSceneModelEntry: (sceneId: string) =>
    sceneId === 'rooftops'
      ? {
          source: '/assets/cinematic/scenes/rooftops/scene.glb',
          useDraco: true,
        }
      : sceneId === 'titanCorridor'
        ? {
            source: '/assets/cinematic/scenes/titan-corridor/scene.glb',
            useDraco: true,
          }
        : undefined,
}));

import { TITAN_MODELS } from '@/constants/modelRegistry';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  MODEL_PRELOAD_LOOKAHEAD,
  isModelSourcePreloaded,
  preloadModelsForScrollProgress,
  resetModelPreloadState,
  resolveModularModelsToPreload,
  resolveScenesToPreload,
} from '@/scenes/models/modelPreload';

function sceneIdsUpToProgress(progress: number, lookahead = MODEL_PRELOAD_LOOKAHEAD) {
  const threshold = progress + lookahead;
  return OPERATION_RAVENNA_TIMELINE.scenes
    .filter((scene) => scene.start <= threshold)
    .map((scene) => scene.id);
}

describe('modelPreload', () => {
  beforeEach(() => {
    resetModelPreloadState();
    vi.clearAllMocks();
  });

  it('preloads scenes that start within the scroll lookahead window', () => {
    expect(resolveScenesToPreload(0)).toEqual(sceneIdsUpToProgress(0));
    expect(resolveScenesToPreload(0.08)).toEqual(sceneIdsUpToProgress(0.08));

    const titanScene = OPERATION_RAVENNA_TIMELINE.scenes.find(
      (scene) => scene.id === 'titanCorridor',
    );
    expect(titanScene).toBeDefined();
    expect(resolveScenesToPreload(titanScene!.start, MODEL_PRELOAD_LOOKAHEAD)).toContain(
      'titanCorridor',
    );
  });

  it('preloads only ready modular models for upcoming scenes', () => {
    const rooftopsScene = OPERATION_RAVENNA_TIMELINE.scenes.find((scene) => scene.id === 'rooftops');
    expect(rooftopsScene).toBeDefined();
    expect(resolveModularModelsToPreload(rooftopsScene!.start)).toEqual([]);

    const titanScene = OPERATION_RAVENNA_TIMELINE.scenes.find(
      (scene) => scene.id === 'titanCorridor',
    );
    expect(titanScene).toBeDefined();
    expect(resolveModularModelsToPreload(titanScene!.start)).toEqual([
      TITAN_MODELS.bullTerrierTitan,
    ]);
  });

  it('queues each GLTF source only once', () => {
    const rooftopsScene = OPERATION_RAVENNA_TIMELINE.scenes.find((scene) => scene.id === 'rooftops');
    expect(rooftopsScene).toBeDefined();

    preloadModelsForScrollProgress(rooftopsScene!.start);
    preloadModelsForScrollProgress(rooftopsScene!.start + 0.02);

    expect(isModelSourcePreloaded('/assets/cinematic/scenes/rooftops/scene.glb')).toBe(true);
    expect(isModelSourcePreloaded(TITAN_MODELS.bullTerrierTitan)).toBe(false);
  });
});
