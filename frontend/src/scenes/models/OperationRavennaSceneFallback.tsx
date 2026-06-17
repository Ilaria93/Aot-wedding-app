import { isOperationRavennaGrayboxEnabled } from '@/constants/operationRavennaGraybox';
import type { OperationRavennaSceneId } from '@/types/scene';
import { FinalArenaEnvironment } from '@/scenes/environments/FinalArenaEnvironment';
import { GiantWallsEnvironment } from '@/scenes/environments/GiantWallsEnvironment';
import { RooftopsDistrictEnvironment } from '@/scenes/environments/RooftopsDistrictEnvironment';
import { TitanCorridorScene } from '@/scenes/titanCorridor/TitanCorridorScene';

type OperationRavennaSceneFallbackProps = {
  sceneId: OperationRavennaSceneId;
  visible: boolean;
};

/**
 * Procedural placeholder shown until the matching Blender GLTF has loaded.
 */
export function OperationRavennaSceneFallback({
  sceneId,
  visible,
}: OperationRavennaSceneFallbackProps) {
  if (!visible || isOperationRavennaGrayboxEnabled()) {
    return null;
  }

  switch (sceneId) {
    case 'rooftops':
      return <RooftopsDistrictEnvironment visible />;
    case 'wallsApproach':
    case 'wallLaunch':
      return <GiantWallsEnvironment visible />;
    case 'titanCorridor':
      return <TitanCorridorScene />;
    case 'coupleStrike':
      return <FinalArenaEnvironment visible />;
    case 'countdownTransition':
      return <FinalArenaEnvironment visible />;
    default:
      return null;
  }
}
