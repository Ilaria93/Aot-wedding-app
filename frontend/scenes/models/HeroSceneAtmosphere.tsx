import { getActiveHeroEnvironment } from '@/scenes/environments/heroEnvironmentChapters';
import type { ScrollProgress } from '@/types/scene';

type HeroSceneAtmosphereProps = {
  progress: ScrollProgress;
};

/**
 * Scroll-driven fog, background and fill lights aligned with hero environment chapters.
 */
export function HeroSceneAtmosphere({ progress }: HeroSceneAtmosphereProps) {
  const { atmosphere } = getActiveHeroEnvironment(progress);

  return (
    <>
      <color attach="background" args={[atmosphere.background]} />
      <fog attach="fog" args={[atmosphere.fogColor, atmosphere.fogNear, atmosphere.fogFar]} />
      <ambientLight intensity={atmosphere.ambientIntensity} />
      <hemisphereLight
        args={[atmosphere.hemisphereSky, atmosphere.hemisphereGround, 0.4]}
      />
    </>
  );
}
