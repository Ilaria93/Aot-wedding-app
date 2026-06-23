import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import {
  getSegmentOdmLegs,
  isPostRooftopOdmPhase,
  isTitanCorridorOdmPhase,
  mapGlobalProgressToSegmentOdm,
  resolveHeroSegmentOdmPose,
  resolvePostRooftopSegment,
} from '@/cinematic/camera/heroSegmentOdmMotion';
import { resolveHeroCameraPose } from '@/cinematic/camera/openingCameraMotion';
import {
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPERATION_RAVENNA_TITAN_CORRIDOR_END,
  OPERATION_RAVENNA_WALL_LAUNCH_END,
} from '@/constants/operationRavennaOpening';

describe('heroSegmentOdmMotion', () => {
  const pose = {
    position: new Vector3(),
    target: new Vector3(),
    roll: 0,
    fov: 60,
    phase: 'pull' as const,
  };

  it('builds ODM legs for walls, titans and finale', () => {
    expect(getSegmentOdmLegs('giantWalls').length).toBeGreaterThan(0);
    expect(getSegmentOdmLegs('titanCorridor').length).toBeGreaterThan(0);
    expect(getSegmentOdmLegs('finalArena').length).toBeGreaterThan(0);
  });

  it('activates post-rooftop ODM after the rooftop segment ends', () => {
    expect(isPostRooftopOdmPhase(OPERATION_RAVENNA_ROOFTOPS_END - 0.01)).toBe(false);
    expect(isPostRooftopOdmPhase(OPERATION_RAVENNA_ROOFTOPS_END)).toBe(true);
    expect(isTitanCorridorOdmPhase(0.72)).toBe(true);
    expect(isTitanCorridorOdmPhase(OPERATION_RAVENNA_WALL_LAUNCH_END)).toBe(true);
    expect(isTitanCorridorOdmPhase(OPERATION_RAVENNA_TITAN_CORRIDOR_END)).toBe(false);
  });

  it('maps global progress to segment-local ODM timing', () => {
    const walls = resolvePostRooftopSegment(0.56);
    expect(walls.segmentId).toBe('giantWalls');
    expect(mapGlobalProgressToSegmentOdm(OPERATION_RAVENNA_ROOFTOPS_END, walls)).toBe(0);

    const titans = resolvePostRooftopSegment(0.72);
    expect(titans.segmentId).toBe('titanCorridor');
    expect(mapGlobalProgressToSegmentOdm(0.72, titans)).toBeGreaterThan(0);
    expect(mapGlobalProgressToSegmentOdm(0.72, titans)).toBeLessThan(1);
  });

  it('moves the camera during the titan corridor instead of freezing on rooftops', () => {
    resolveHeroCameraPose(0.72, pose);
    const titanPose = pose.position.clone();

    resolveHeroCameraPose(0.78, pose);
    const laterPose = pose.position.clone();

    expect(titanPose.distanceTo(laterPose)).toBeGreaterThan(1);
    expect(pose.phase).toBeDefined();
  });

  it('applies banking during fast titan corridor redirects', () => {
    resolveHeroSegmentOdmPose(0.76, pose);
    const earlyRoll = pose.roll;

    resolveHeroSegmentOdmPose(0.8, pose);
    const lateRoll = pose.roll;

    expect(Math.abs(earlyRoll) + Math.abs(lateRoll)).toBeGreaterThan(0.01);
  });
});
