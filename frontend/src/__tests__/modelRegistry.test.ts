import { describe, expect, it } from 'vitest';

import {
  MODEL_ASSET_BASE,
  RAVENNA_MODELS,
  READY_MODEL_URLS,
  SQUAD_MODELS,
  TITAN_MODELS,
} from '@/constants/modelRegistry';

describe('modelRegistry', () => {
  it('keeps modular assets under the shared public models base path', () => {
    expect(TITAN_MODELS.bullTerrierTitan).toBe(
      `${MODEL_ASSET_BASE}/titans/bull_terrier_titan.glb`,
    );
    expect(TITAN_MODELS.bullTerrierCharacter).toBe(
      `${MODEL_ASSET_BASE}/titans/bull_terrier_character.glb`,
    );
    expect(RAVENNA_MODELS.bellTower).toBe(`${MODEL_ASSET_BASE}/ravenna/bell_tower.glb`);
    expect(SQUAD_MODELS.ilaria).toBe(`${MODEL_ASSET_BASE}/squad/ilaria.glb`);
  });

  it('only marks shipped GLBs as ready for preload', () => {
    expect(READY_MODEL_URLS.has(TITAN_MODELS.bullTerrierTitan)).toBe(true);
    expect(READY_MODEL_URLS.has(SQUAD_MODELS.ilaria)).toBe(false);
    expect(READY_MODEL_URLS.has(RAVENNA_MODELS.houseSmall)).toBe(false);
  });
});
