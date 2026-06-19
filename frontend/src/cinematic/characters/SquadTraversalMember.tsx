import type { SquadMemberId, SquadMemberPose } from '@/types/squadTraversal';

type SquadTraversalMemberProps = {
  member: SquadMemberId;
  pose: SquadMemberPose;
  visible: boolean;
};

const MEMBER_COLORS: Record<SquadMemberId, string> = {
  bride: '#e8d7c6',
  groom: '#7f9bbd',
};

/**
 * Simple capsule placeholder for squad choreography validation (left = bride, right = groom).
 */
export function SquadTraversalMember({ member, pose, visible }: SquadTraversalMemberProps) {
  if (!visible || pose.visibility <= 0.05) {
    return null;
  }

  return (
    <group position={pose.position} rotation={pose.rotation}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.42, 1.1, 6, 12]} />
        <meshStandardMaterial color={MEMBER_COLORS[member]} roughness={0.9} metalness={0.04} />
      </mesh>
    </group>
  );
}
