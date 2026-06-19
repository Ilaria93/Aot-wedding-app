import { describe, expect, it } from 'vitest';

import {
  getRooftopsTraversalProgress,
  getStreetOpeningTraversalProgress,
  isRooftopsSquadActive,
  resolveSquadChoreographyProgress,
  resolveSquadManeuverOffset,
  resolveSquadMemberPose,
  resolveSquadTraversal,
  rooftopsTraversalToCameraProgress,
} from '@/scenes/sequences/squadTraversal';
import {
  OPENING_SQUAD_HOOK_CHOREOGRAPHY,
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
} from '@/constants/operationRavennaOpening';
import { Vector3 } from 'three';

describe('squadTraversal', () => {
  describe('scene activation', () => {
    it('stays hidden during the quiet street opening', () => {
      expect(isRooftopsSquadActive(0)).toBe(false);
      expect(isRooftopsSquadActive(0.05)).toBe(false);
    });

    it('activates with the existing rooftop ODM segment', () => {
      expect(isRooftopsSquadActive(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(true);
      expect(isRooftopsSquadActive(0.2)).toBe(true);
      expect(isRooftopsSquadActive(OPERATION_RAVENNA_ROOFTOPS_END)).toBe(false);
    });

    it('aligns choreography to the hook when ODM begins', () => {
      expect(resolveSquadChoreographyProgress(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBeCloseTo(
        OPENING_SQUAD_HOOK_CHOREOGRAPHY,
        4,
      );
      expect(getStreetOpeningTraversalProgress(0.045)).toBeCloseTo(0.5, 5);
      expect(getRooftopsTraversalProgress(0.255)).toBeCloseTo(0.5, 5);
    });
  });

  describe('resolveSquadTraversal', () => {
    it('places bride on the left wing and groom on the right in formation offsets', () => {
      const bride = resolveSquadManeuverOffset('bride', OPENING_SQUAD_HOOK_CHOREOGRAPHY);
      const groom = resolveSquadManeuverOffset('groom', OPENING_SQUAD_HOOK_CHOREOGRAPHY);

      expect(bride.lateral).toBeLessThan(0);
      expect(groom.lateral).toBeGreaterThan(0);
    });

    it('fades the squad in at the first hook', () => {
      const hidden = resolveSquadTraversal(OPERATION_RAVENNA_GROUND_SPRINT_END + 0.005);
      const visible = resolveSquadTraversal(OPERATION_RAVENNA_GROUND_SPRINT_END + 0.03);

      expect(hidden.bride.visibility).toBeLessThan(0.4);
      expect(visible.bride.visibility).toBeGreaterThan(0.7);
    });

    it('dims members when occluded behind rooftops', () => {
      const visible = resolveSquadManeuverOffset('groom', 0.55);
      const occluded = resolveSquadManeuverOffset('groom', 0.66);

      expect(occluded.visibility).toBeLessThan(visible.visibility);
    });

    it('preserves continuous motion without large jumps', () => {
      const position = new Vector3();
      let previous = resolveSquadMemberPose('bride', OPERATION_RAVENNA_GROUND_SPRINT_END + 0.02, position);

      for (let step = 1; step <= 20; step += 1) {
        const progress =
          OPERATION_RAVENNA_GROUND_SPRINT_END +
          (step / 20) * (OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END);
        const current = resolveSquadMemberPose('bride', progress, position);
        const delta = Math.hypot(
          current.position[0] - previous.position[0],
          current.position[1] - previous.position[1],
          current.position[2] - previous.position[2],
        );

        expect(delta).toBeLessThan(25);
        previous = current;
      }
    });

    it('maps choreography progress monotonically along the rooftops camera span', () => {
      const early = rooftopsTraversalToCameraProgress(OPENING_SQUAD_HOOK_CHOREOGRAPHY + 0.05);
      const late = rooftopsTraversalToCameraProgress(0.95);

      expect(late).toBeGreaterThan(early);
    });
  });
});
