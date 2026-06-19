import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPENING_RUN_PHASE_END,
  OPENING_WALK_PHASE_END,
} from '@/constants/operationRavennaOpening';
import { streetOpeningPath } from '@/data/cameraPaths';
import {
  isAerialTraversalPhase,
  isOdmGearVisible,
  isOpeningUiHidden,
  isStaticOpeningFrame,
  isStreetOpeningPhase,
  mapGlobalProgressToAerialOdm,
  resolveHeroCameraPose,
  resolveOdmGearRevealOpacity,
  resolveStaticOpeningPose,
  resolveStreetOpeningPathEase,
  resolveStreetOpeningPhase,
  sampleStreetOpeningPose,
} from '@/cinematic/camera/openingCameraMotion';

describe('openingCameraMotion', () => {
  const pose = {
    position: new Vector3(),
    target: new Vector3(),
    roll: 0,
    fov: 60,
    phase: 'static' as const,
  };

  it('keeps the opening frame static at progress zero', () => {
    resolveHeroCameraPose(0, pose);

    expect(pose.phase).toBe('static');
    expect(pose.position.x).toBeCloseTo(streetOpeningPath[0].x, 3);
    expect(pose.position.z).toBeCloseTo(10, 0);
    expect(pose.roll).toBe(0);
    expect(pose.fov).toBe(54);
  });

  it('starts with a walk before transitioning to a run', () => {
    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * 0.1, pose);
    expect(resolveStreetOpeningPhase(0.1)).toBe('walk');

    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * 0.4, pose);
    expect(resolveStreetOpeningPhase(0.4)).toBe('run');
    expect(pose.phase).toBe('run');
  });

  it('accelerates hardest at the end of the street sequence', () => {
    const midDelta =
      resolveStreetOpeningPathEase(OPENING_RUN_PHASE_END) -
      resolveStreetOpeningPathEase(OPENING_RUN_PHASE_END - 0.1);
    const lateDelta =
      resolveStreetOpeningPathEase(1) - resolveStreetOpeningPathEase(0.9);

    expect(lateDelta).toBeGreaterThan(midDelta);
  });

  it('hides UI and ODM gear until the first hook', () => {
    expect(isOpeningUiHidden(0)).toBe(true);
    expect(isOpeningUiHidden(0.05)).toBe(true);
    expect(isOpeningUiHidden(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(false);
    expect(isOdmGearVisible(0.05)).toBe(false);
    expect(isOdmGearVisible(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(true);
    expect(resolveOdmGearRevealOpacity(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(0);
    expect(resolveOdmGearRevealOpacity(0.1)).toBeGreaterThan(0.5);
  });

  it('adds head bob only after the walk begins', () => {
    resolveStaticOpeningPose(pose);
    const staticY = pose.position.y;

    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * OPENING_WALK_PHASE_END * 0.5, pose);
    const walkY = pose.position.y;

    expect(Math.abs(walkY - staticY)).toBeGreaterThan(0.005);
  });

  it('switches to aerial ODM only after the street sequence ends', () => {
    resolveHeroCameraPose(0.12, pose);

    expect(isStreetOpeningPhase(0.05)).toBe(true);
    expect(isAerialTraversalPhase(0.12)).toBe(true);
    expect(pose.phase).not.toBe('static');
    expect(pose.phase).not.toBe('walk');
    expect(pose.position.y).toBeGreaterThan(2.5);
  });

  it('maps aerial progress from the rooftop launch window', () => {
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(0);
    expect(isStaticOpeningFrame(0)).toBe(true);
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_ROOFTOPS_END)).toBe(1);
  });
});
