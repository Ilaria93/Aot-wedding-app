import {
  COUPLE_STRIKE_IMPACT_PROGRESS,
  getCoupleStrikeProgress,
  isCoupleStrikeSceneActive,
  resolveCoupleStrikeSequence,
} from '@/utils/coupleStrikeSequence';

describe('coupleStrikeSequence', () => {
  describe('getCoupleStrikeProgress', () => {
    it('returns 0 before the coupleStrike scene', () => {
      expect(getCoupleStrikeProgress(0)).toBe(0);
      expect(getCoupleStrikeProgress(0.71)).toBe(0);
    });

    it('returns 1 after the coupleStrike scene', () => {
      expect(getCoupleStrikeProgress(0.9)).toBe(1);
      expect(getCoupleStrikeProgress(1)).toBe(1);
    });

    it('maps local progress inside the coupleStrike window', () => {
      expect(getCoupleStrikeProgress(0.72)).toBe(0);
      expect(getCoupleStrikeProgress(0.78)).toBeCloseTo(0.5, 5);
      expect(getCoupleStrikeProgress(0.84)).toBe(1);
    });
  });

  describe('isCoupleStrikeSceneActive', () => {
    it('is active during coupleStrike and countdownTransition', () => {
      expect(isCoupleStrikeSceneActive(0.71)).toBe(false);
      expect(isCoupleStrikeSceneActive(0.72)).toBe(true);
      expect(isCoupleStrikeSceneActive(0.9)).toBe(true);
      expect(isCoupleStrikeSceneActive(0.97)).toBe(true);
    });
  });

  describe('resolveCoupleStrikeSequence', () => {
    it('starts characters behind the camera on the Z axis', () => {
      const state = resolveCoupleStrikeSequence(0);

      expect(state.progress).toBe(0);
      expect(state.phase).toBe('approach');
      expect(state.left.position[2]).toBeGreaterThan(8);
      expect(state.right.position[2]).toBeGreaterThan(8);
    });

    it('moves characters past the viewer during overtake', () => {
      const state = resolveCoupleStrikeSequence(0.44);

      expect(state.phase).toBe('overtake');
      expect(state.left.position[2]).toBeLessThan(2);
      expect(state.right.position[2]).toBeLessThan(2);
    });

    it('applies synchronized spin during the spin phase', () => {
      const state = resolveCoupleStrikeSequence(0.6);

      expect(state.phase).toBe('spin');
      expect(Math.abs(state.left.rotation[1])).toBeGreaterThan(1);
      expect(Math.abs(state.right.rotation[1])).toBeGreaterThan(1);
    });

    it('converges blades in front of the camera at cross', () => {
      const state = resolveCoupleStrikeSequence(0.78);

      expect(state.phase).toBe('cross');
      expect(state.bladesCrossed).toBe(true);
      expect(Math.abs(state.left.position[0])).toBeLessThan(0.7);
      expect(Math.abs(state.right.position[0])).toBeLessThan(0.7);
      expect(state.left.position[2]).toBeGreaterThan(0.2);
      expect(state.right.position[2]).toBeGreaterThan(0.2);
    });

    it('peaks flash intensity at impact progress', () => {
      const impact = resolveCoupleStrikeSequence(COUPLE_STRIKE_IMPACT_PROGRESS);
      const before = resolveCoupleStrikeSequence(COUPLE_STRIKE_IMPACT_PROGRESS - 0.06);
      const after = resolveCoupleStrikeSequence(COUPLE_STRIKE_IMPACT_PROGRESS + 0.06);

      expect(impact.flashIntensity).toBeGreaterThan(before.flashIntensity);
      expect(impact.flashIntensity).toBeGreaterThan(after.flashIntensity);
      expect(impact.flashIntensity).toBeGreaterThan(0.8);
    });

    it('clamps progress to the normalized range', () => {
      const state = resolveCoupleStrikeSequence(1.5);

      expect(state.progress).toBe(1);
      expect(state.phase).toBe('aftermath');
    });
  });
});
