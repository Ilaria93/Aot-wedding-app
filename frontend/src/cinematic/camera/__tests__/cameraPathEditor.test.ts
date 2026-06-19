import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import { CAMERA_PATHS } from '@/data/cameraPaths';
import {
  buildCameraTimelineFromPathDefinitions,
  createCameraCatmullRomCurve,
  resolveCurrentCameraPathSegment,
  sampleCatmullRomPolyline,
} from '@/cinematic/camera/cameraPathEditor';
import { assertValidCameraTimeline } from '@/cinematic/camera/cameraRig';
import { HERO_CAMERA_TIMELINE } from '@/cinematic/camera/heroCameraTimeline';

describe('cameraPathEditor', () => {
  it('builds a valid hero timeline from editable path definitions', () => {
    const timeline = buildCameraTimelineFromPathDefinitions(CAMERA_PATHS);

    expect(timeline.segments).toHaveLength(CAMERA_PATHS.length);
    expect(() => assertValidCameraTimeline(timeline)).not.toThrow();
    expect(HERO_CAMERA_TIMELINE.segments).toHaveLength(CAMERA_PATHS.length);
  });

  it('creates curves from Vector3 control points and samples polylines', () => {
    const points = [
      new Vector3(0, 0, 0),
      new Vector3(0, 2, 4),
      new Vector3(0, 4, 8),
    ];
    const curve = createCameraCatmullRomCurve(points);
    const polyline = sampleCatmullRomPolyline(curve, 8);

    expect(points).toHaveLength(3);
    expect(polyline).toHaveLength(9);
    expect(polyline[0].z).toBeCloseTo(0, 5);
    expect(polyline[8].z).toBeCloseTo(8, 1);
  });

  it('resolves active camera path segment from global progress', () => {
    expect(resolveCurrentCameraPathSegment(0).segmentName).toBe('streetOpening');
    expect(resolveCurrentCameraPathSegment(0.2).segmentName).toBe('rooftops');
    expect(resolveCurrentCameraPathSegment(0.5).segmentName).toBe('giantWalls');
    expect(resolveCurrentCameraPathSegment(0.7).segmentName).toBe('titanCorridor');
    expect(resolveCurrentCameraPathSegment(0.9).segmentName).toBe('finalArena');
    expect(resolveCurrentCameraPathSegment(0.51).localProgress).toBeCloseTo(0.5, 5);
  });
});
