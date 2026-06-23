import { aotTheme } from '@/constants/aotTheme';

/** First-person mobility gear palette — AoT-inspired tones, generic silhouettes. */
export const odmGearTheme = {
  gripMetal: '#3a4038',
  gripAccent: aotTheme.bronze,
  cableSteel: '#8a9199',
  gasCore: '#e8efe8',
  gasEdge: '#b8c4bc',
} as const;

/** Local-space anchor for a lower-corner gear handle (camera-attached). */
export const ODM_HANDLE_OFFSET = {
  x: 0.34,
  y: -0.26,
  z: -0.18,
} as const;

export const ODM_CABLE_BASE_LENGTH = 1.35;
export const ODM_CABLE_SPEED_STRETCH = 0.55;
export const ODM_CABLE_ACCEL_SWAY = 0.035;

export const ODM_PARTICLE_POOL_SIZE = 96;
export const ODM_PARTICLE_BURST_THRESHOLD = 1.45;
export const ODM_PARTICLE_SPAWN_PER_BURST = 6;
/** Extra micro-bursts when entering the ODM overshoot / redirect phase. */
export const ODM_PARTICLE_REDIRECT_BURST_COUNT = 2;
