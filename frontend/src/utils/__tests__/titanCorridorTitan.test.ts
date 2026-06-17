import { BULL_TERRIER_TITAN_PLACEMENT } from '@/constants/titanCorridorTitanConfig';
import {
  clampHeadTrackingAngles,
  computeBreathingScale,
  computeUniformScaleForHeight,
  resolveIdleAnimationName,
  resolveTitanGroundY,
} from '@/utils/titanCorridorTitan';

describe('titanCorridorTitan utils', () => {
  it('resolves idle animation by name', () => {
    expect(resolveIdleAnimationName(['Walk', 'Idle_Loop', 'Run'])).toBe('Idle_Loop');
    expect(resolveIdleAnimationName(['Walk', 'Run'])).toBe('Walk');
    expect(resolveIdleAnimationName([])).toBeNull();
  });

  it('scales native height to target meters', () => {
    expect(computeUniformScaleForHeight(2, 50)).toBe(25);
    expect(computeUniformScaleForHeight(0, 50)).toBe(1);
  });

  it('places feet on the ground plane', () => {
    expect(resolveTitanGroundY(-1.8, 25, 0)).toBeCloseTo(45);
  });

  it('clamps head tracking for subtle motion', () => {
    const angles = clampHeadTrackingAngles(1.2, 0.9);
    expect(angles.yaw).toBeLessThanOrEqual(0.26);
    expect(angles.pitch).toBeLessThanOrEqual(0.26 * 0.55);
  });

  it('targets a ~50 m colossus beside the corridor path', () => {
    expect(BULL_TERRIER_TITAN_PLACEMENT.targetHeightMeters).toBe(50);
    expect(BULL_TERRIER_TITAN_PLACEMENT.position[0]).toBeLessThan(-20);
  });

  it('produces a slow breathing pulse', () => {
    expect(computeBreathingScale(0, 0)).toBeCloseTo(1, 2);
    expect(computeBreathingScale(Math.PI / (2 * 0.62), 0)).toBeGreaterThan(1);
  });
});
