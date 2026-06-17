import type { OperationRavennaSceneId } from '@/types/scene';

/** Metro asset id or remote URL accepted by `useGLTF`. */
export type CinematicGltfSource = string | number;

/** Transform applied to every Blender export before it enters the scene graph. */
export type GltfTransform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

/** GLTF bundle for a single Operation Ravenna scroll scene. */
export type CinematicSceneModelEntry = {
  sceneId: OperationRavennaSceneId;
  /** Folder under `assets/cinematic/` — drop in a new `scene.glb` to replace the placeholder. */
  assetDirectory: string;
  /** Metro asset id returned by `require()` for `scene.glb`. */
  source: CinematicGltfSource;
  /** Enable Draco decoding for compressed Blender exports. */
  useDraco: boolean;
  transform: GltfTransform;
};

const rooftopsSceneGlb = require('@/assets/cinematic/scenes/rooftops/scene.glb') as number;
const wallsApproachSceneGlb = require('@/assets/cinematic/scenes/walls-approach/scene.glb') as number;
const wallLaunchSceneGlb = require('@/assets/cinematic/scenes/wall-launch/scene.glb') as number;
const titanCorridorSceneGlb = require('@/assets/cinematic/scenes/titan-corridor/scene.glb') as number;
const coupleStrikeSceneGlb = require('@/assets/cinematic/scenes/couple-strike/scene.glb') as number;

/**
 * Operation Ravenna GLTF registry.
 * Replace each `scene.glb` with the final Blender export — no code changes required.
 */
export const CINEMATIC_SCENE_MODEL_ENTRIES: readonly CinematicSceneModelEntry[] = [
  {
    sceneId: 'rooftops',
    assetDirectory: 'scenes/rooftops',
    source: rooftopsSceneGlb,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'wallsApproach',
    assetDirectory: 'scenes/walls-approach',
    source: wallsApproachSceneGlb,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'wallLaunch',
    assetDirectory: 'scenes/wall-launch',
    source: wallLaunchSceneGlb,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'titanCorridor',
    assetDirectory: 'scenes/titan-corridor',
    source: titanCorridorSceneGlb,
    useDraco: true,
    transform: {},
  },
  {
    sceneId: 'coupleStrike',
    assetDirectory: 'scenes/couple-strike',
    source: coupleStrikeSceneGlb,
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
