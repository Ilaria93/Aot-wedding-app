import type { OperationRavennaSceneId } from '@/types/scene';

/** Public URL or remote URL accepted by `useGLTF`. */
export type CinematicGltfSource = string;

/** Transform applied to every Blender export before it enters the scene graph. */
export type GltfTransform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

/** GLTF bundle for a single Operation Ravenna scroll scene. */
export type CinematicSceneModelEntry = {
  sceneId: OperationRavennaSceneId;
  /** Folder under `public/assets/cinematic/` — drop in a new `scene.glb` to replace the placeholder. */
  assetDirectory: string;
  /** Public path to `scene.glb` served from `frontend/public`. */
  source: CinematicGltfSource;
  /** Enable Draco decoding for compressed Blender exports. */
  useDraco: boolean;
  transform: GltfTransform;
};

const CINEMATIC_ASSET_BASE = '/assets/cinematic';

/**
 * Operation Ravenna GLTF registry.
 * Replace each `scene.glb` with the final Blender export — no code changes required.
 */
export const CINEMATIC_SCENE_MODEL_ENTRIES: readonly CinematicSceneModelEntry[] = [
  {
    sceneId: 'rooftops',
    assetDirectory: 'scenes/rooftops',
    source: `${CINEMATIC_ASSET_BASE}/scenes/rooftops/scene.glb`,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'wallsApproach',
    assetDirectory: 'scenes/walls-approach',
    source: `${CINEMATIC_ASSET_BASE}/scenes/walls-approach/scene.glb`,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'wallLaunch',
    assetDirectory: 'scenes/wall-launch',
    source: `${CINEMATIC_ASSET_BASE}/scenes/wall-launch/scene.glb`,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'titanCorridor',
    assetDirectory: 'scenes/titan-corridor',
    source: `${CINEMATIC_ASSET_BASE}/scenes/titan-corridor/scene.glb`,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'coupleStrike',
    assetDirectory: 'scenes/couple-strike',
    source: `${CINEMATIC_ASSET_BASE}/scenes/couple-strike/scene.glb`,
    useDraco: true,
    transform: {},
  },
] as const;

/** Returns the GLTF registry entry for a scene id, if configured. */
export function getCinematicSceneModelEntry(
  sceneId: OperationRavennaSceneId,
): CinematicSceneModelEntry | undefined {
  return CINEMATIC_SCENE_MODEL_ENTRIES.find((entry) => entry.sceneId === sceneId);
}

/** Unique GLTF sources to preload (deduplicated when scenes share an arena export). */
export function getCinematicModelSources(): readonly CinematicGltfSource[] {
  return [...new Set(CINEMATIC_SCENE_MODEL_ENTRIES.map((entry) => entry.source))];
}
