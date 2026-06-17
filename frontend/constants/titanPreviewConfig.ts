/** Absurd scale presets — the project lives or dies on colossal feel. */
export const TITAN_SCALE_PRESETS = [
  { id: 'normal', label: '1×', value: 1 },
  { id: 'colossal', label: '20×', value: 20 },
  { id: 'absurd', label: '50×', value: 50 },
] as const;

export type TitanScalePresetId = (typeof TITAN_SCALE_PRESETS)[number]['id'];

export const DEFAULT_TITAN_SCALE = 20;

export type TitanPreviewCameraPreset = {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
};

/** Camera presets — foot-close is the scale truth test. */
export const TITAN_PREVIEW_CAMERA_PRESETS: readonly TitanPreviewCameraPreset[] = [
  {
    id: 'foot',
    label: 'Vicino al piede',
    position: [8, 6, 14],
    target: [0, 8, 0],
  },
  {
    id: 'knee',
    label: 'Altezza ginocchio',
    position: [18, 14, 28],
    target: [0, 16, 0],
  },
  {
    id: 'overview',
    label: 'Panoramica',
    position: [90, 70, 110],
    target: [0, 45, 0],
  },
] as const;

export const DEFAULT_TITAN_CAMERA_PRESET_ID = 'foot';
