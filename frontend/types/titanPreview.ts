import type { TitanPreviewModelId } from '@/constants/titanPreviewAssets';

/** Runtime state shared between TitanPreview canvas and debug panel. */
export type TitanPreviewState = {
  modelId: TitanPreviewModelId;
  scale: number;
  activeAnimation: string | null;
  animationNames: string[];
  cameraPresetId: string;
};
