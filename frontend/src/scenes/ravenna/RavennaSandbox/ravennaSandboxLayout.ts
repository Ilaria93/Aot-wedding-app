import type { RavennaBuildingPlacement } from '@/scenes/ravenna/RavennaBuilding';

/**
 * Six hand-placed houses flanking the opening street trajectory for scale and style validation.
 * Positions follow the static camera vista and early scroll path (x ≈ ±8–10, z ≈ 8 → -16).
 */
export const RAVENNA_SANDBOX_PLACEMENTS: readonly RavennaBuildingPlacement[] = [
  { position: [-8.6, 0, 8], rotation: [0, 0.14, 0], scale: 1 },
  { position: [8.4, 0, 4.5], rotation: [0, -0.1, 0], scale: 0.92 },
  { position: [-9.2, 0, -0.5], rotation: [0, 0.06, 0], scale: 1.06 },
  { position: [9.1, 0, -3.8], rotation: [0, -0.18, 0], scale: 0.88 },
  { position: [-7.9, 0, -9.5], rotation: [0, 0.22, 0], scale: 1.02 },
  { position: [8.7, 0, -13.5], rotation: [0, -0.12, 0], scale: 0.95 },
] as const;
