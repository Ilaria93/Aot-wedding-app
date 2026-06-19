import { isRavennaSandboxEnabled } from '@/constants/ravennaSandbox';
import { GrayboxFinalArena } from '@/scenes/graybox/GrayboxFinalArena';
import { GrayboxGiantWalls } from '@/scenes/graybox/GrayboxGiantWalls';
import { GrayboxOpeningEstablishingShot } from '@/scenes/graybox/GrayboxOpeningEstablishingShot';
import { GrayboxRooftops } from '@/scenes/graybox/GrayboxRooftops';
import { GrayboxTitanCorridor } from '@/scenes/graybox/GrayboxTitanCorridor';
import { RavennaSandbox } from '@/scenes/ravenna/RavennaSandbox';

/**
 * Full Operation Ravenna graybox world in world-space coordinates aligned with camera paths.
 * The opening establishing set is hand-authored for the static first frame.
 */
export function OperationRavennaGrayboxWorld({
  showTraversalWorld = true,
}: {
  /** When false, only the establishing shot is rendered (static first frame). */
  showTraversalWorld?: boolean;
}) {
  return (
    <group name="operation-ravenna-graybox">
      <GrayboxOpeningEstablishingShot hideStreetFacades={isRavennaSandboxEnabled()} />
      {isRavennaSandboxEnabled() ? <RavennaSandbox /> : null}
      {showTraversalWorld ? (
        <>
          <GrayboxRooftops />
          <GrayboxGiantWalls />
          <GrayboxTitanCorridor />
          <GrayboxFinalArena />
        </>
      ) : null}
    </group>
  );
}
