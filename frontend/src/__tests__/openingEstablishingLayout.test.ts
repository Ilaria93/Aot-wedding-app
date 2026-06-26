import { describe, expect, it } from 'vitest';

import {
  OPENING_BELL_TOWER_POSITION,
  OPENING_ESTABLISHING_CAMERA_FOV,
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
  OPENING_HORIZON_WALL_POSITION,
} from '@/scenes/graybox/openingEstablishingLayout';

describe('openingEstablishingLayout', () => {
  it('places the camera on the footpath looking toward the city center', () => {
    const [cameraX, , cameraZ] = OPENING_ESTABLISHING_CAMERA_POSITION;
    const [, , targetZ] = OPENING_ESTABLISHING_CAMERA_TARGET;
    const [, , towerZ] = OPENING_BELL_TOWER_POSITION;
    const [, , wallZ] = OPENING_HORIZON_WALL_POSITION;

    expect(cameraX).toBeLessThan(-8);
    expect(targetZ).toBeLessThan(cameraZ);
    expect(towerZ).toBeLessThan(targetZ);
    expect(wallZ).toBeLessThan(towerZ);
  });

  it('starts the camera on the countryside footpath in a low sprint pose', () => {
    const [, eyeY, cameraZ] = OPENING_ESTABLISHING_CAMERA_POSITION;
    const [, targetY] = OPENING_ESTABLISHING_CAMERA_TARGET;

    expect(cameraZ).toBeGreaterThan(70);
    expect(eyeY).toBeLessThan(1.55);
    expect(targetY).toBeLessThan(eyeY + 3);
  });

  it('uses a cinematic field of view for the establishing frame', () => {
    expect(OPENING_ESTABLISHING_CAMERA_FOV).toBeGreaterThanOrEqual(50);
    expect(OPENING_ESTABLISHING_CAMERA_FOV).toBeLessThanOrEqual(64);
  });
});
