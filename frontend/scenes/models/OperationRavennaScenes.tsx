import { Suspense, useCallback, useState } from 'react';

import type { CinematicSceneModelEntry } from '@/constants/cinematicModelRegistry';
import type { OperationRavennaSceneId } from '@/types/scene';
import { markCinematicSceneLoaded } from '@/scenes/models/loadedCinematicScenes';
import { OperationRavennaSceneFallback } from '@/scenes/models/OperationRavennaSceneFallback';
import { SceneGltfLoadingFallback } from '@/scenes/models/SceneGltfLoadingFallback';
import { SceneGltfModel } from '@/scenes/models/SceneGltfModel';

type CinematicSceneSlotProps = {
  entry: CinematicSceneModelEntry;
  activeSceneId: OperationRavennaSceneId;
};

/**
 * Mounts procedural fallback, suspense loader and GLTF for a single Operation Ravenna scene.
 */
function CinematicSceneSlot({ entry, activeSceneId }: CinematicSceneSlotProps) {
  const [hasRenderableGltf, setHasRenderableGltf] = useState(false);
  const showPlaceholder = !hasRenderableGltf;

  const markSceneLoaded = useCallback(
    (hasRenderableGeometry: boolean) => {
      if (!hasRenderableGeometry) {
        return;
      }

      markCinematicSceneLoaded(entry.sceneId);
      setHasRenderableGltf(true);
    },
    [entry.sceneId],
  );

  return (
    <group name={`scene-slot-${entry.sceneId}`}>
      {showPlaceholder ? (
        <OperationRavennaSceneFallback sceneId={activeSceneId} visible />
      ) : null}

      <Suspense fallback={<SceneGltfLoadingFallback label={entry.sceneId} />}>
        <SceneGltfModel entry={entry} visible onLoaded={markSceneLoaded} />
      </Suspense>
    </group>
  );
}

type OperationRavennaScenesProps = {
  activeSceneId: OperationRavennaSceneId;
  entry: CinematicSceneModelEntry;
};

/**
 * Renders the active Operation Ravenna scene slot with GLTF loading and procedural fallback.
 */
export function OperationRavennaScenes({ activeSceneId, entry }: OperationRavennaScenesProps) {
  return (
    <group name="operation-ravenna-scenes">
      <CinematicSceneSlot entry={entry} activeSceneId={activeSceneId} />
    </group>
  );
}
