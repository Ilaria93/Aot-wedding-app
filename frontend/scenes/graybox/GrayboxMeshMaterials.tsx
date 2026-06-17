import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import type { GrayboxBoxSpec } from '@/scenes/graybox/types';

const TONE_COLORS: Record<GrayboxBoxSpec['tone'], string> = {
  structure: GRAYBOX_PALETTE.structure,
  structureAlt: GRAYBOX_PALETTE.structureAlt,
  structureDark: GRAYBOX_PALETTE.structureDark,
};

/** Resolves a flat meshStandard color for a graybox structure tone. */
export function getGrayboxToneColor(tone: GrayboxBoxSpec['tone']): string {
  return TONE_COLORS[tone];
}
