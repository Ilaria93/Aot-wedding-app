import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import {
  OPENING_ODM_GEAR_REVEAL_START,
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPENING_RUN_PHASE_END,
  OPENING_WALK_PHASE_END,
} from '@/constants/operationRavennaOpening';
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

  it('starts in a sprint pose on the left footpath at progress zero', () => {
    resolveHeroCameraPose(0, pose);

    expect(pose.phase).toBe('run');
    expect(pose.position.x).toBeLessThan(-8);
    expect(pose.position.z).toBeGreaterThan(70);
    expect(pose.fov).toBeGreaterThanOrEqual(62);
  });

  it('keeps sprinting before transitioning into the final acceleration', () => {
    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * 0.05, pose);
    expect(resolveStreetOpeningPhase(0.05)).toBe('run');

    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * 0.5, pose);
    expect(resolveStreetOpeningPhase(0.5)).toBe('run');
    expect(pose.phase).toBe('run');
  });

  it('surges into the hook during the final street acceleration', () => {
    expect(resolveStreetOpeningPathEase(1)).toBeCloseTo(1);
    expect(resolveStreetOpeningPathEase(OPENING_RUN_PHASE_END)).toBeLessThan(0.9);
    expect(resolveStreetOpeningPathEase(1)).toBeGreaterThan(
      resolveStreetOpeningPathEase(OPENING_RUN_PHASE_END),
    );
  });

  it('hides UI until the hook while revealing ODM gear during the late sprint', () => {
    expect(isOpeningUiHidden(0)).toBe(true);
    expect(isOpeningUiHidden(0.04)).toBe(true);
    expect(isOpeningUiHidden(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(false);
    expect(isOdmGearVisible(0.03)).toBe(false);
    expect(isOdmGearVisible(OPENING_ODM_GEAR_REVEAL_START)).toBe(true);
    expect(resolveOdmGearRevealOpacity(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBeGreaterThan(0.5);
  });

  it('adds sprint head bob from the first frame', () => {
    resolveHeroCameraPose(0, pose);
    const sprintY = pose.position.y;

    sampleStreetOpeningPose(OPERATION_RAVENNA_GROUND_SPRINT_END * 0.2, pose);
    const laterY = pose.position.y;

    expect(sprintY).toBeGreaterThan(1.4);
    expect(Math.abs(laterY - sprintY)).toBeGreaterThan(0.001);
  });

  it('switches to aerial ODM only after the street sequence ends', () => {
    resolveHeroCameraPose(0.12, pose);

    expect(isStreetOpeningPhase(0.02)).toBe(true);
    expect(isAerialTraversalPhase(0.12)).toBe(true);
    expect(pose.phase).not.toBe('static');
    expect(pose.phase).not.toBe('walk');
    expect(pose.position.y).toBeGreaterThan(2);
  });

  it('maps aerial progress from the rooftop launch window', () => {
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(0);
    expect(isStaticOpeningFrame(0)).toBe(false);
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_ROOFTOPS_END)).toBe(1);
  });

  it('continues ODM motion on giant walls after rooftops end', () => {
    resolveHeroCameraPose(OPERATION_RAVENNA_ROOFTOPS_END + 0.02, pose);
    const wallPose = pose.position.clone();

    resolveHeroCameraPose(0.62, pose);

    expect(wallPose.distanceTo(pose.position)).toBeGreaterThan(0.5);
    expect(['release', 'pull', 'overshoot']).toContain(pose.phase);
  });
});
