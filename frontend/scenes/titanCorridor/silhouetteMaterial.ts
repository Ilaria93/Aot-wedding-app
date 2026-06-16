import { aotTheme } from '@/constants/aotTheme';

/** Shared dark material for all corridor silhouettes — one GPU program, minimal overdraw. */
export const SILHOUETTE_MATERIAL_PROPS = {
  color: aotTheme.cinematicBackground,
  emissive: '#0a0f0c',
  emissiveIntensity: 0.15,
  roughness: 0.92,
  metalness: 0.02,
} as const;
