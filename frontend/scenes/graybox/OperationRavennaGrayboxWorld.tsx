import { GrayboxFinalArena } from '@/scenes/graybox/GrayboxFinalArena';
import { GrayboxGiantWalls } from '@/scenes/graybox/GrayboxGiantWalls';
import { GrayboxRooftops } from '@/scenes/graybox/GrayboxRooftops';
import { GrayboxTitanCorridor } from '@/scenes/graybox/GrayboxTitanCorridor';

/**
 * Full Operation Ravenna graybox world in world-space coordinates aligned with camera paths.
 * All segments stay mounted so scale and camera movement can be validated across the full scroll.
 */
export function OperationRavennaGrayboxWorld() {
  return (
    <group name="operation-ravenna-graybox">
      <GrayboxRooftops />
      <GrayboxGiantWalls />
      <GrayboxTitanCorridor />
      <GrayboxFinalArena />
    </group>
  );
}
