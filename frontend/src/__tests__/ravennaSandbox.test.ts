import { describe, expect, it } from 'vitest';

import { isRavennaSandboxEnabled, RAVENNA_SANDBOX_ENABLED } from '@/constants/ravennaSandbox';
import { RAVENNA_HOUSE_SMALL_GLB } from '@/scenes/ravenna/ravennaHouseSmallAsset';
import { RAVENNA_SANDBOX_PLACEMENTS } from '@/scenes/ravenna/RavennaSandbox/ravennaSandboxLayout';

describe('Ravenna modular sandbox', () => {
  it('resolves the house_small GLB from src/assets via Vite URL import', () => {
    expect(RAVENNA_HOUSE_SMALL_GLB).toContain('house_small');
    expect(RAVENNA_HOUSE_SMALL_GLB).toMatch(/\.glb/);
  });

  it('places six sandbox buildings with varied transforms', () => {
    expect(RAVENNA_SANDBOX_PLACEMENTS).toHaveLength(6);

    const scales = RAVENNA_SANDBOX_PLACEMENTS.map((placement) => placement.scale);
    const uniqueScales = new Set(scales.map((scale) => JSON.stringify(scale)));

    expect(uniqueScales.size).toBeGreaterThan(1);
  });

  it('exposes a sandbox toggle for the hero scene', () => {
    expect(RAVENNA_SANDBOX_ENABLED).toBe(true);
    expect(isRavennaSandboxEnabled()).toBe(true);
  });
});
