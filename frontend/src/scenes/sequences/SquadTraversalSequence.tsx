import { useMemo } from 'react';

import { SquadTraversalMember } from '@/cinematic/characters/SquadTraversalMember';
import {
  isRooftopsSquadActive,
  resolveSquadTraversalFromGlobal,
} from '@/scenes/sequences/squadTraversal';

type SquadTraversalSequenceProps = {
  /** Global hero scroll progress in the range [0, 1]. */
  globalProgress?: number;
};

/**
 * Scroll-driven squad — right and left capsules following the ODM camera path.
 */
export function SquadTraversalSequence({ globalProgress = 0 }: SquadTraversalSequenceProps) {
  const isActive = useMemo(() => isRooftopsSquadActive(globalProgress), [globalProgress]);
  const state = useMemo(
    () => resolveSquadTraversalFromGlobal(globalProgress),
    [globalProgress],
  );

  return (
    <group name="squad-traversal">
      <SquadTraversalMember member="bride" pose={state.bride} visible={isActive} />
      <SquadTraversalMember member="groom" pose={state.groom} visible={isActive} />
    </group>
  );
}

export { isRooftopsSquadActive, resolveSquadTraversalFromGlobal };
