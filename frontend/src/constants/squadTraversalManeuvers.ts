import type { SquadMemberId, SquadOffsetKeyframe } from '@/types/squadTraversal';

/**
 * Continuous squad choreography across ground sprint and rooftop traversal.
 * Progress 0–1 spans the full active squad window (street opening + rooftops).
 * ~0.22 marks the synchronized first ODM hook.
 */

/** Ilaria — left wing: formation escort, overtakes, rooftop occlusion, rejoin. */
export const BRIDE_SQUAD_KEYFRAMES: readonly SquadOffsetKeyframe[] = [
  { start: 0, end: 0.14, kind: 'formation', forward: -1.8, lateral: -3.4, vertical: -0.4 },
  { start: 0.14, end: 0.22, kind: 'formation', forward: 0.5, lateral: -3.6, vertical: -0.32 },
  { start: 0.22, end: 0.34, kind: 'formation', forward: -1.0, lateral: -3.8, vertical: 0.05 },
  { start: 0.34, end: 0.46, kind: 'overtake', forward: 4.6, lateral: -5.3, vertical: 1.15 },
  { start: 0.46, end: 0.54, kind: 'occluded', forward: 2.1, lateral: -2.6, vertical: -1.5, visibility: 0.28 },
  { start: 0.54, end: 0.66, kind: 'rejoin', forward: -0.4, lateral: -3.5, vertical: 0.15 },
  { start: 0.66, end: 0.76, kind: 'crossFront', forward: 3.6, lateral: 0.5, vertical: 0.75 },
  { start: 0.76, end: 0.84, kind: 'occluded', forward: 1.4, lateral: -4.0, vertical: -1.2, visibility: 0.32 },
  { start: 0.84, end: 1, kind: 'formation', forward: 0.9, lateral: -3.6, vertical: 0.2 },
];

/** Davide — right wing: mirrored escort with offset overtakes and rooftop dips. */
export const GROOM_SQUAD_KEYFRAMES: readonly SquadOffsetKeyframe[] = [
  { start: 0, end: 0.14, kind: 'formation', forward: -1.6, lateral: 3.5, vertical: -0.42 },
  { start: 0.14, end: 0.22, kind: 'formation', forward: 0.6, lateral: 3.7, vertical: -0.28 },
  { start: 0.22, end: 0.38, kind: 'formation', forward: -0.8, lateral: 3.9, vertical: 0 },
  { start: 0.38, end: 0.5, kind: 'rejoin', forward: -1.2, lateral: 4.2, vertical: -0.08 },
  { start: 0.5, end: 0.62, kind: 'overtake', forward: 4.0, lateral: 4.9, vertical: 0.85 },
  { start: 0.62, end: 0.7, kind: 'occluded', forward: 2.0, lateral: 3.1, vertical: -1.4, visibility: 0.26 },
  { start: 0.7, end: 0.82, kind: 'rejoin', forward: -0.2, lateral: 4.0, vertical: 0.1 },
  { start: 0.82, end: 0.92, kind: 'crossFront', forward: 4.3, lateral: -0.35, vertical: 0.6 },
  { start: 0.92, end: 1, kind: 'formation', forward: 1.1, lateral: 3.8, vertical: 0.25 },
];

const SQUAD_MEMBER_KEYFRAMES: Record<SquadMemberId, readonly SquadOffsetKeyframe[]> = {
  bride: BRIDE_SQUAD_KEYFRAMES,
  groom: GROOM_SQUAD_KEYFRAMES,
};

/** Returns the maneuver keyframe track for a squad member. */
export function getSquadMemberKeyframes(member: SquadMemberId): readonly SquadOffsetKeyframe[] {
  return SQUAD_MEMBER_KEYFRAMES[member];
}
