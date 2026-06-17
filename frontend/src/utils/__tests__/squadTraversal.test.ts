import {
  getRooftopsTraversalProgress,
  isRooftopsSquadActive,
  resolveSquadManeuverOffset,
  resolveSquadMemberPose,
  resolveSquadTraversal,
  rooftopsTraversalToCameraProgress,
} from '@/utils/squadTraversal';
import { Vector3 } from 'three';

describe('squadTraversal', () => {
  describe('scene activation', () => {
    it('is active only during the rooftops scene window', () => {
      expect(isRooftopsSquadActive(0)).toBe(true);
      expect(isRooftopsSquadActive(0.27)).toBe(true);
      expect(isRooftopsSquadActive(0.28)).toBe(false);
      expect(isRooftopsSquadActive(0.5)).toBe(false);
    });

    it('maps global progress to rooftops-local traversal progress', () => {
      expect(getRooftopsTraversalProgress(0)).toBe(0);
      expect(getRooftopsTraversalProgress(0.14)).toBeCloseTo(0.5, 5);
      expect(getRooftopsTraversalProgress(0.28)).toBe(1);
    });
  });

  describe('resolveSquadTraversal', () => {
    it('places bride on the right wing and groom on the left in formation offsets', () => {
      const bride = resolveSquadManeuverOffset('bride', 0.05);
      const groom = resolveSquadManeuverOffset('groom', 0.05);

      expect(bride.lateral).toBeGreaterThan(0);
      expect(groom.lateral).toBeLessThan(0);
      expect(bride.lateral - groom.lateral).toBeGreaterThan(5);
    });

    it('moves the bride ahead during the right overtake maneuver', () => {
      const formation = resolveSquadTraversal(0.12);
      const overtake = resolveSquadTraversal(0.28);
      const brideDeltaZ = overtake.bride.position[2] - formation.bride.position[2];

      expect(brideDeltaZ).toBeLessThan(-1);
      expect(overtake.bride.position[0] - formation.bride.position[0]).toBeGreaterThan(0.5);
    });

    it('moves the groom ahead during the left overtake maneuver', () => {
      const before = resolveSquadTraversal(0.22);
      const overtake = resolveSquadTraversal(0.36);
      const groomDeltaZ = overtake.groom.position[2] - before.groom.position[2];

      expect(groomDeltaZ).toBeLessThan(-0.5);
    });

    it('pulls the groom behind the camera before he surges ahead', () => {
      const early = resolveSquadManeuverOffset('groom', 0.2);
      const overtake = resolveSquadManeuverOffset('groom', 0.4);

      expect(early.forward).toBeLessThan(-1);
      expect(overtake.forward).toBeGreaterThan(early.forward);
    });

    it('crosses the bride in front of the camera path', () => {
      const formation = resolveSquadManeuverOffset('bride', 0.4);
      const cross = resolveSquadManeuverOffset('bride', 0.54);

      expect(Math.abs(cross.lateral)).toBeLessThan(Math.abs(formation.lateral));
      expect(cross.forward).toBeGreaterThan(3);
    });

    it('crosses the groom in front of the camera later in the sequence', () => {
      const formation = resolveSquadManeuverOffset('groom', 0.5);
      const cross = resolveSquadManeuverOffset('groom', 0.68);

      expect(Math.abs(cross.lateral)).toBeLessThan(Math.abs(formation.lateral));
      expect(cross.forward).toBeGreaterThan(3.5);
    });

    it('preserves continuous motion without large jumps', () => {
      const position = new Vector3();
      let previous = resolveSquadMemberPose('bride', 0, position);

      for (let step = 1; step <= 20; step += 1) {
        const progress = step / 20;
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

    it('maps traversal progress monotonically along the rooftops camera span', () => {
      const early = rooftopsTraversalToCameraProgress(0.1);
      const late = rooftopsTraversalToCameraProgress(0.9);

      expect(late).toBeGreaterThan(early);
    });
  });
});
