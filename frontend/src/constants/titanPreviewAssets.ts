import { TITAN_MODELS } from '@/constants/modelRegistry';

/** Ironwolf colossus GLB assets for the TitanPreview dev scene. */
export const TITAN_PREVIEW_MODELS = {
  mergedAnimations: TITAN_MODELS.bullTerrierTitan,
  character: TITAN_MODELS.bullTerrierCharacter,
} as const;

export type TitanPreviewModelId = keyof typeof TITAN_PREVIEW_MODELS;

export const TITAN_PREVIEW_MODEL_LABELS: Record<TitanPreviewModelId, string> = {
  mergedAnimations: 'Merged animations',
  character: 'Character output',
};

export {
  DEFAULT_TITAN_CAMERA_PRESET_ID,
  DEFAULT_TITAN_SCALE,
  TITAN_PREVIEW_CAMERA_PRESETS,
  TITAN_SCALE_PRESETS,
  type TitanPreviewCameraPreset,
  type TitanScalePresetId,
} from '@/constants/titanPreviewConfig';
