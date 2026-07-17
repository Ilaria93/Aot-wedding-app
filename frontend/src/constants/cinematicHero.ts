/**
 * When false, the landing page skips the pinned 3D cinematic hero and opens on editorial content.
 * Re-enable with VITE_CINEMATIC_HERO_ENABLED=true in frontend/.env
 */
export function isCinematicHeroEnabled(): boolean {
  return import.meta.env.VITE_CINEMATIC_HERO_ENABLED === 'true';
}
