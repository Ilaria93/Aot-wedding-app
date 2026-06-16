import type { HeroEnvironmentChapter, HeroEnvironmentId } from '@/scenes/environments/types';

export const HERO_ENVIRONMENT_CHAPTERS: readonly HeroEnvironmentChapter[] = [
  {
    id: 'rooftopsDistrict',
    start: 0,
    end: 0.25,
    atmosphere: {
      background: '#3d4548',
      fogColor: '#5a6368',
      fogNear: 6,
      fogFar: 22,
      ambientIntensity: 0.42,
      hemisphereSky: '#c9d4d8',
      hemisphereGround: '#3a4245',
    },
  },
  {
    id: 'giantWalls',
    start: 0.25,
    end: 0.5,
    atmosphere: {
      background: '#4a5258',
      fogColor: '#7a848c',
      fogNear: 4,
      fogFar: 18,
      ambientIntensity: 0.32,
      hemisphereSky: '#b8c2ca',
      hemisphereGround: '#454d54',
    },
  },
  {
    id: 'titanCorridor',
    start: 0.5,
    end: 0.75,
    atmosphere: {
      background: '#1a2118',
      fogColor: '#2a3428',
      fogNear: 3,
      fogFar: 14,
      ambientIntensity: 0.22,
      hemisphereSky: '#4a5a48',
      hemisphereGround: '#141a14',
    },
  },
  {
    id: 'finalArena',
    start: 0.75,
    end: 1,
    atmosphere: {
      background: '#1f2420',
      fogColor: '#3a4038',
      fogNear: 8,
      fogFar: 26,
      ambientIntensity: 0.38,
      hemisphereSky: '#d8c4a0',
      hemisphereGround: '#2a3028',
    },
  },
] as const;

export type ActiveHeroEnvironment = HeroEnvironmentChapter & {
  index: number;
};

/** Resolves the active placeholder environment for a scroll progress value. */
export function getActiveHeroEnvironment(progress: number): ActiveHeroEnvironment {
  const clamped = Math.min(1, Math.max(0, progress));

  for (let index = 0; index < HERO_ENVIRONMENT_CHAPTERS.length; index += 1) {
    const chapter = HERO_ENVIRONMENT_CHAPTERS[index];
    const isLast = index === HERO_ENVIRONMENT_CHAPTERS.length - 1;
    const isActive =
      clamped >= chapter.start && (clamped < chapter.end || (isLast && clamped <= chapter.end));

    if (isActive) {
      return { ...chapter, index };
    }
  }

  const fallback = HERO_ENVIRONMENT_CHAPTERS[HERO_ENVIRONMENT_CHAPTERS.length - 1];
  return { ...fallback, index: HERO_ENVIRONMENT_CHAPTERS.length - 1 };
}

/** Returns whether a given environment should be visible at the current progress. */
export function isHeroEnvironmentVisible(
  environmentId: HeroEnvironmentId,
  progress: number,
): boolean {
  return getActiveHeroEnvironment(progress).id === environmentId;
}
