import { describe, expect, it } from 'vitest';

import { describe, expect, it } from 'vitest';

import { isOperationRavennaGrayboxEnabled } from '@/constants/operationRavennaGraybox';
import {
  GRAYBOX_ARENA_PLATFORM,
  GRAYBOX_DESTINATION_WALL,
  GRAYBOX_ROOFTOP_BUILDINGS,
  GRAYBOX_TITAN_SILHOUETTES,
} from '@/scenes/graybox/grayboxLayout';

describe('operationRavennaGraybox', () => {
  it('is enabled for scale previs', () => {
    expect(isOperationRavennaGrayboxEnabled()).toBe(true);
  });
});

describe('grayboxLayout', () => {
  it('places rooftops across the district behind the flight corridor', () => {
    const minZ = Math.min(...GRAYBOX_ROOFTOP_BUILDINGS.map((building) => building.position[2]));
    const maxZ = Math.max(...GRAYBOX_ROOFTOP_BUILDINGS.map((building) => building.position[2]));

    expect(maxZ).toBeLessThanOrEqual(8);
    expect(minZ).toBeLessThan(-40);
  });

  it('places titan silhouettes before the final arena platform along -Z', () => {
    const furthestTitanZ = Math.min(
      ...GRAYBOX_TITAN_SILHOUETTES.map((titan) => titan.position[2]),
    );
    expect(furthestTitanZ).toBeGreaterThan(GRAYBOX_ARENA_PLATFORM.position[2]);
  });

  it('defines a single dominant destination wall', () => {
    expect(GRAYBOX_DESTINATION_WALL.size[0]).toBeGreaterThan(150);
    expect(GRAYBOX_DESTINATION_WALL.size[1]).toBeGreaterThan(90);
  });
});
