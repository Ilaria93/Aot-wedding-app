import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';

/** Neutral flat lighting for graybox previs — no HDR environment or fog. */
export function GrayboxHeroAtmosphere() {
  return (
    <>
      <color attach="background" args={[GRAYBOX_PALETTE.background]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#e8e8e8', '#a0a0a0', 0.35]} />
    </>
  );
}
