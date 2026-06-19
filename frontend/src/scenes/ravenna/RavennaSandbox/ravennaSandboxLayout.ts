import {
  OPENING_FACADE_OFFSET_X,
  OPENING_STREET_FACADE_BLOCKS,
} from '@/scenes/graybox/openingEstablishingLayout';
import type { RavennaBuildingPlacement } from '@/scenes/ravenna/RavennaBuilding';
import {
  resolveRavennaHouseSmallGroundY,
  resolveRavennaHouseSmallScale,
} from '@/scenes/ravenna/ravennaHouseSmallMetrics';

type FacadeSide = 'left' | 'right';

const SIDE_ROTATION: Record<FacadeSide, number> = {
  left: Math.PI / 2,
  right: -Math.PI / 2,
};

const SIDE_YAW_VARIATION: Record<FacadeSide, number> = {
  left: 0.08,
  right: -0.06,
};

function resolveHeightMultiplier(blockHeight: number): number {
  return blockHeight / 11;
}

function buildPlacement(
  side: FacadeSide,
  blockIndex: number,
): RavennaBuildingPlacement {
  const block = OPENING_STREET_FACADE_BLOCKS[blockIndex];
  const sign = side === 'left' ? -1 : 1;
  const scale = resolveRavennaHouseSmallScale(resolveHeightMultiplier(block.h));
  const yawJitter =
    (blockIndex % 2 === 0 ? 1 : -1) *
    SIDE_YAW_VARIATION[side] *
    (1 + (blockIndex % 3) * 0.15);

  return {
    position: [sign * OPENING_FACADE_OFFSET_X, resolveRavennaHouseSmallGroundY(scale), block.z],
    rotation: [0, SIDE_ROTATION[side] + yawJitter, 0],
    scale,
  };
}

/**
 * Modular `house_small` row along the full opening street — both sides, deep into the city.
 */
export const RAVENNA_SANDBOX_PLACEMENTS: readonly RavennaBuildingPlacement[] =
  OPENING_STREET_FACADE_BLOCKS.flatMap((_block, blockIndex) => [
    buildPlacement('left', blockIndex),
    buildPlacement('right', blockIndex),
  ]);
