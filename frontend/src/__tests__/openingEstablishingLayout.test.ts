import { describe, expect, it } from 'vitest';

import {
  OPENING_BELL_TOWER_POSITION,
  OPENING_ESTABLISHING_CAMERA_FOV,
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
  OPENING_HORIZON_WALL_POSITION,
} from '@/scenes/graybox/openingEstablishingLayout';

describe('openingEstablishingLayout', () => {
  it('places the camera on the street looking toward the city center', () => {
    const [, , cameraZ] = OPENING_ESTABLISHING_CAMERA_POSITION;
    const [, , targetZ] = OPENING_ESTABLISHING_CAMERA_TARGET;
    const [, , towerZ] = OPENING_BELL_TOWER_POSITION;
    const [, , wallZ] = OPENING_HORIZON_WALL_POSITION;

    expect(targetZ).toBeLessThan(cameraZ);
    expect(towerZ).toBeLessThan(targetZ);
    expect(wallZ).toBeLessThan(towerZ);
  });

  it('uses a cinematic field of view for the establishing frame', () => {
    expect(OPENING_ESTABLISHING_CAMERA_FOV).toBeGreaterThanOrEqual(50);
    expect(OPENING_ESTABLISHING_CAMERA_FOV).toBeLessThanOrEqual(64);
  });

  it('starts the camera far from the city center in a low sprint pose', () => {
    const [, eyeY, cameraZ] = OPENING_ESTABLISHING_CAMERA_POSITION;
    const [, targetY] = OPENING_ESTABLISHING_CAMERA_TARGET;

    expect(cameraZ).toBeGreaterThan(60);
    expect(eyeY).toBeLessThan(1.55);
    expect(targetY).toBeLessThan(eyeY + 3);
  });
});
