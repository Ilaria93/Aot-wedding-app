/** Normalized rooftops squad traversal progress in the range [0, 1]. */
export type SquadTraversalProgress = number;

/** Squad member identifiers for Operation Ravenna rooftops traversal. */
export type SquadMemberId = 'bride' | 'groom';

/** Scripted maneuver kinds driving formation changes. */
export type SquadManeuverKind =
  | 'formation'
  | 'overtake'
  | 'crossFront'
  | 'occluded'
  | 'rejoin';

/** Offset relative to the camera path frame (forward / lateral / vertical). */
export type SquadMemberOffset = {
  readonly forward: number;
  readonly lateral: number;
  readonly vertical: number;
  readonly visibility: number;
};

/** Keyframed offset track for one squad member. */
export type SquadOffsetKeyframe = {
  readonly start: SquadTraversalProgress;
  readonly end: SquadTraversalProgress;
  readonly kind: SquadManeuverKind;
  readonly forward: number;
  readonly lateral: number;
  readonly vertical: number;
  readonly visibility?: number;
};

/** World-space pose for a squad member during traversal. */
export type SquadMemberPose = {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly visibility: number;
};

/** Resolved squad state at a rooftops traversal progress. */
export type SquadTraversalState = {
  readonly progress: SquadTraversalProgress;
  readonly bride: SquadMemberPose;
  readonly groom: SquadMemberPose;
};
