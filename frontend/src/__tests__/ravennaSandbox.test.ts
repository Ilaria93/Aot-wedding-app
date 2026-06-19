import { describe, expect, it } from 'vitest';

import { isRavennaSandboxEnabled, RAVENNA_SANDBOX_ENABLED } from '@/constants/ravennaSandbox';
import { OPENING_FACADE_OFFSET_X } from '@/scenes/graybox/openingEstablishingLayout';
import { RAVENNA_HOUSE_SMALL_GLB } from '@/scenes/ravenna/ravennaHouseSmallAsset';
import {
  RAVENNA_HOUSE_SMALL_WORLD_SCALE,
  resolveRavennaHouseSmallGroundY,
} from '@/scenes/ravenna/ravennaHouseSmallMetrics';
import { RAVENNA_SANDBOX_PLACEMENTS } from '@/scenes/ravenna/RavennaSandbox/ravennaSandboxLayout';

describe('Ravenna modular sandbox', () => {
  it('resolves the house_small GLB from src/assets via Vite URL import', () => {
    expect(RAVENNA_HOUSE_SMALL_GLB).toContain('house_small');
    expect(RAVENNA_HOUSE_SMALL_GLB).toMatch(/\.glb/);
  });

  it('scales houses to graybox facade height and rests them on the ground', () => {
    expect(RAVENNA_HOUSE_SMALL_WORLD_SCALE).toBeGreaterThan(6);
    expect(RAVENNA_SANDBOX_PLACEMENTS[0].position[1]).toBe(
      resolveRavennaHouseSmallGroundY(RAVENNA_SANDBOX_PLACEMENTS[0].scale as number),
    );
  });

  it('places many sandbox buildings along the full facade row', () => {
    expect(RAVENNA_SANDBOX_PLACEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(RAVENNA_SANDBOX_PLACEMENTS.length % 2).toBe(0);

    for (const placement of RAVENNA_SANDBOX_PLACEMENTS) {
      expect(Math.abs(placement.position[0])).toBe(OPENING_FACADE_OFFSET_X);
      expect(placement.position[1]).toBeGreaterThan(4);
    }

    const scales = RAVENNA_SANDBOX_PLACEMENTS.map((placement) => placement.scale);
    const uniqueScales = new Set(scales.map((scale) => JSON.stringify(scale)));

    expect(uniqueScales.size).toBeGreaterThan(1);
  });

  it('exposes a sandbox toggle for the hero scene', () => {
    expect(RAVENNA_SANDBOX_ENABLED).toBe(true);
    expect(isRavennaSandboxEnabled()).toBe(true);
  });
});
