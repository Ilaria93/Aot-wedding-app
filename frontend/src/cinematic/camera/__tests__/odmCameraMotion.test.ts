import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import { ODM_CAMERA_ANCHORS, ODM_CAMERA_LEGS } from '@/data/odmCameraAnchors';
import {
  DEFAULT_ODM_CAMERA_TUNING,
  assertValidOdmCameraLegs,
  buildOdmCameraLegs,
  findActiveOdmLeg,
  grapplePullFactor,
  resolveOdmCameraPose,
  resolveOdmGrapplePhase,
  resolveOdmVelocityFov,
  sampleOdmLegPose,
} from '@/cinematic/camera/odmCameraMotion';
import { resolveHeroCameraPose } from '@/cinematic/camera/openingCameraMotion';

describe('odmCameraMotion', () => {
  it('alternates anchor sides left and right', () => {
    expect(ODM_CAMERA_ANCHORS.length).toBeGreaterThan(2);
    expect(ODM_CAMERA_ANCHORS[0]?.side).toBe('right');
    expect(ODM_CAMERA_ANCHORS[1]?.side).toBe('left');
    expect(ODM_CAMERA_ANCHORS[2]?.side).toBe('right');
  });

  it('covers the full scroll range with distance-weighted legs', () => {
    expect(ODM_CAMERA_LEGS.length).toBe(ODM_CAMERA_ANCHORS.length - 1);
    expect(ODM_CAMERA_LEGS[0]?.start).toBe(0);
    expect(ODM_CAMERA_LEGS[ODM_CAMERA_LEGS.length - 1]?.end).toBeCloseTo(1, 5);
  });

  it('accelerates toward the anchor then overshoots at leg end', () => {
    const mid = grapplePullFactor(0.35, DEFAULT_ODM_CAMERA_TUNING);
    const end = grapplePullFactor(1, DEFAULT_ODM_CAMERA_TUNING);

    expect(mid).toBeLessThan(0.55);
    expect(end).toBeGreaterThan(1);
  });

  it('applies gravity sag at the midpoint of a leg', () => {
    const leg = ODM_CAMERA_LEGS[0];
    const position = new Vector3();
    const target = new Vector3();
    const pose = {
      position,
      target,
      roll: 0,
      fov: DEFAULT_ODM_CAMERA_TUNING.baseFov,
      phase: 'release' as const,
    };

    sampleOdmLegPose(ODM_CAMERA_LEGS, 0, 0, pose, DEFAULT_ODM_CAMERA_TUNING);
    const startY = position.y;

    sampleOdmLegPose(ODM_CAMERA_LEGS, 0, 0.5, pose, DEFAULT_ODM_CAMERA_TUNING);
    const midY = position.y;

    sampleOdmLegPose(ODM_CAMERA_LEGS, 0, 1, pose, DEFAULT_ODM_CAMERA_TUNING);
    const endY = position.y;

    expect(midY).toBeLessThan(startY);
    expect(midY).toBeLessThan(endY);
  });

  it('is not linear — chord progress grows faster late in the pull', () => {
    const early = grapplePullFactor(0.2, DEFAULT_ODM_CAMERA_TUNING);
    const late = grapplePullFactor(0.6, DEFAULT_ODM_CAMERA_TUNING) - early;

    expect(late).toBeGreaterThan(early);
  });

  it('resolves pose at progress zero to the sprint opening', () => {
    const position = new Vector3();
    const target = new Vector3();
    resolveHeroCameraPose(0, {
      position,
      target,
      roll: 0,
      fov: DEFAULT_ODM_CAMERA_TUNING.baseFov,
      phase: 'run',
    });

    expect(position.y).toBeCloseTo(1.46, 1);
    expect(position.z).toBeCloseTo(68, 0);
  });

  it('maps scroll progress to the expected leg', () => {
    const rebuilt = buildOdmCameraLegs(ODM_CAMERA_ANCHORS);
    const active = findActiveOdmLeg(rebuilt, 0.5);

    expect(active.index).toBeGreaterThanOrEqual(0);
    expect(active.localProgress).toBeGreaterThanOrEqual(0);
    expect(active.localProgress).toBeLessThanOrEqual(1);
  });

  it('passes dev validation for pre-built Operation Ravenna legs', () => {
    expect(() => assertValidOdmCameraLegs(ODM_CAMERA_LEGS)).not.toThrow();
    expect(ODM_CAMERA_LEGS[ODM_CAMERA_LEGS.length - 1]?.end).toBe(1);
  });

  it('exposes release, pull and overshoot phases across a leg', () => {
    expect(resolveOdmGrapplePhase(0.05)).toBe('release');
    expect(resolveOdmGrapplePhase(0.4)).toBe('pull');
    expect(resolveOdmGrapplePhase(0.9)).toBe('overshoot');
  });

  it('widens FOV as pull speed increases', () => {
    const slowFov = resolveOdmVelocityFov(5, DEFAULT_ODM_CAMERA_TUNING);
    const fastFov = resolveOdmVelocityFov(80, DEFAULT_ODM_CAMERA_TUNING);

    expect(fastFov).toBeGreaterThan(slowFov);
    expect(slowFov).toBeCloseTo(DEFAULT_ODM_CAMERA_TUNING.baseFov, 0);
  });

  it('banks into redirects near the end of a leg', () => {
    const position = new Vector3();
    const target = new Vector3();
    const pose = {
      position,
      target,
      roll: 0,
      fov: DEFAULT_ODM_CAMERA_TUNING.baseFov,
      phase: 'release' as const,
    };

    sampleOdmLegPose(ODM_CAMERA_LEGS, 1, 0.2, pose, DEFAULT_ODM_CAMERA_TUNING);
    const earlyRoll = pose.roll;

    sampleOdmLegPose(ODM_CAMERA_LEGS, 1, 0.92, pose, DEFAULT_ODM_CAMERA_TUNING);
    const lateRoll = pose.roll;

    expect(Math.abs(lateRoll)).toBeGreaterThan(Math.abs(earlyRoll));
  });
});
