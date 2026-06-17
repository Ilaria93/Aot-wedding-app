import type { SquadMemberId, SquadOffsetKeyframe } from '@/types/squadTraversal';

/** Right wing — formation, overtake, fall behind, cross in front of POV. */
export const BRIDE_SQUAD_KEYFRAMES: readonly SquadOffsetKeyframe[] = [
  { start: 0, end: 0.14, kind: 'formation', forward: -1.6, lateral: 3.8, vertical: -0.2 },
  { start: 0.14, end: 0.32, kind: 'overtake', forward: 3.6, lateral: 4.2, vertical: 0.5 },
  { start: 0.32, end: 0.46, kind: 'rejoin', forward: -1.8, lateral: 3.4, vertical: -0.25 },
  { start: 0.46, end: 0.62, kind: 'crossFront', forward: 4.2, lateral: -0.4, vertical: 0.4 },
  { start: 0.62, end: 0.8, kind: 'rejoin', forward: -0.8, lateral: 3.6, vertical: 0 },
  { start: 0.8, end: 1, kind: 'formation', forward: 1.2, lateral: 3.2, vertical: 0.15 },
];

/** Left wing — formation, overtake, fall behind, cross in front later in the sequence. */
export const GROOM_SQUAD_KEYFRAMES: readonly SquadOffsetKeyframe[] = [
  { start: 0, end: 0.14, kind: 'formation', forward: -1.8, lateral: -3.6, vertical: -0.25 },
  { start: 0.14, end: 0.3, kind: 'rejoin', forward: -2.4, lateral: -4.2, vertical: -0.35 },
  { start: 0.3, end: 0.48, kind: 'overtake', forward: 3.9, lateral: -3.2, vertical: 0.55 },
  { start: 0.48, end: 0.6, kind: 'rejoin', forward: -1.4, lateral: -3.8, vertical: -0.15 },
  { start: 0.6, end: 0.76, kind: 'crossFront', forward: 4.5, lateral: 0.6, vertical: 0.35 },
  { start: 0.76, end: 1, kind: 'formation', forward: 0.6, lateral: -3.4, vertical: 0.05 },
];

const SQUAD_MEMBER_KEYFRAMES: Record<SquadMemberId, readonly SquadOffsetKeyframe[]> = {
  bride: BRIDE_SQUAD_KEYFRAMES,
  groom: GROOM_SQUAD_KEYFRAMES,
};

/** Returns the maneuver keyframe track for a squad member. */
export function getSquadMemberKeyframes(member: SquadMemberId): readonly SquadOffsetKeyframe[] {
  return SQUAD_MEMBER_KEYFRAMES[member];
}
