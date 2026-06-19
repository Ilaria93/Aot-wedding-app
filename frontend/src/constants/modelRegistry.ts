import type { OperationRavennaSceneId } from '@/types/scene';

/** Public base path for modular GLB assets under `frontend/public/assets/models/`. */
export const MODEL_ASSET_BASE = '/assets/models';

/** Public URL accepted by `useGLTF`. */
export type ModelAssetUrl = `${typeof MODEL_ASSET_BASE}/${string}`;

/** Ravenna district kit — instanced rooftops, porticos and street props. */
export const RAVENNA_MODELS = {
  houseSmall: `${MODEL_ASSET_BASE}/ravenna/house_small.glb`,
  houseMedium: `${MODEL_ASSET_BASE}/ravenna/house_medium.glb`,
  bellTower: `${MODEL_ASSET_BASE}/ravenna/bell_tower.glb`,
  arcade: `${MODEL_ASSET_BASE}/ravenna/arcade.glb`,
  chimney: `${MODEL_ASSET_BASE}/ravenna/chimney.glb`,
} as const satisfies Record<string, ModelAssetUrl>;

/** Colossal titans — corridor obstacles and dev preview rigs. */
export const TITAN_MODELS = {
  bullTerrierTitan: `${MODEL_ASSET_BASE}/titans/bull_terrier_titan.glb`,
  bullTerrierCharacter: `${MODEL_ASSET_BASE}/titans/bull_terrier_character.glb`,
} as const satisfies Record<string, ModelAssetUrl>;

/** Wedding squad characters for rooftop traversal and couple strike. */
export const SQUAD_MODELS = {
  ilaria: `${MODEL_ASSET_BASE}/squad/ilaria.glb`,
  davide: `${MODEL_ASSET_BASE}/squad/davide.glb`,
} as const satisfies Record<string, ModelAssetUrl>;

/** Modular assets that exist on disk and can be preloaded safely. */
export const READY_MODEL_URLS = new Set<ModelAssetUrl>([
  TITAN_MODELS.bullTerrierTitan,
  TITAN_MODELS.bullTerrierCharacter,
]);

/** Scroll segments that should warm the modular asset cache (paths must be in READY_MODEL_URLS). */
export const MODULAR_PRELOAD_BY_SCENE: Partial<
  Record<OperationRavennaSceneId, readonly ModelAssetUrl[]>
> = {
  rooftops: [SQUAD_MODELS.ilaria, SQUAD_MODELS.davide],
  titanCorridor: [TITAN_MODELS.bullTerrierTitan],
};
