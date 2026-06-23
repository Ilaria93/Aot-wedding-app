import { describe, expect, it } from 'vitest';

import {
  buildGrayboxRooftopPlatforms,
  buildGiantWallOdmPath,
  buildStreetFirstHook,
  buildTitanCorridorOdmPath,
  resolveDestinationWallFaceZ,
} from '@/data/odmWorldAnchors';
import { buildFlightCorridorPath } from '@/data/flightCorridorPath';
import { GRAYBOX_DESTINATION_WALL } from '@/scenes/graybox/grayboxLayout';
import {
  distanceToRooftopsFlightPath,
  ROOFTOP_DISTRICT_LAYOUT,
} from '@/scenes/graybox/grayboxRooftopDistrict';

describe('odmWorldAnchors', () => {
  it('places the first street hook on the opening facade, not inside the volume', () => {
    const hook = buildStreetFirstHook();

    expect(hook.x).toBeLessThan(-8);
    expect(hook.y).toBeGreaterThan(8);
  });

  it('builds four rooftop platforms from graybox buildings', () => {
    const platforms = buildGrayboxRooftopPlatforms(ROOFTOP_DISTRICT_LAYOUT.buildings);

    expect(platforms).toHaveLength(4);
    expect(platforms[0]?.streetHook).toBeDefined();
    expect(platforms[0]?.outboundHook).toBeDefined();
  });

  it('keeps giant wall path in front of the wall face', () => {
    const faceZ = resolveDestinationWallFaceZ();
    const path = buildGiantWallOdmPath();

    for (const point of path.slice(1)) {
      expect(point.z).toBeGreaterThan(faceZ);
    }
  });

  it('aligns wall path with the destination wall center', () => {
    const [centerX] = GRAYBOX_DESTINATION_WALL.position;
    const path = buildGiantWallOdmPath();

    expect(path[0]?.z).toBeGreaterThan(resolveDestinationWallFaceZ());
    expect(Math.abs((path[3]?.x ?? 0) - centerX)).toBeLessThan(8);
  });

  it('weaves the titan corridor between silhouette placements', () => {
    const path = buildTitanCorridorOdmPath();

    expect(path.length).toBeGreaterThanOrEqual(8);
    expect(path[0]?.y).toBeGreaterThan(40);
    expect(path[path.length - 1]?.z).toBeCloseTo(-278, 0);
  });

  it('keeps flight corridor clear of rooftop building centers', () => {
    const corridor = buildFlightCorridorPath();

    for (const point of corridor) {
      expect(distanceToRooftopsFlightPath(point.x, point.z)).toBeLessThan(12);
    }
  });
});
