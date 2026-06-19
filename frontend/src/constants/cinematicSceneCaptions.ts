import type { OperationRavennaSceneId } from '@/types/scene';

export type SceneCaptionSideConfig = {
  eyebrowKey: string;
  titleKey: string;
};

export type SceneCaptionConfig = {
  sceneId: OperationRavennaSceneId;
  fadeInStart: number;
  fadeInEnd: number;
  fadeOutStart: number;
  fadeOutEnd: number;
  left: SceneCaptionSideConfig;
  right: SceneCaptionSideConfig;
};

/** Scroll-driven left/right caption windows per Operation Ravenna scene (local progress). */
export const CINEMATIC_SCENE_CAPTIONS: readonly SceneCaptionConfig[] = [
  {
    sceneId: 'streetOpening',
    fadeInStart: 0.12,
    fadeInEnd: 0.28,
    fadeOutStart: 0.78,
    fadeOutEnd: 0.94,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.streetOpening.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.streetOpening.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.streetOpening.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.streetOpening.rightTitle',
    },
  },
  {
    sceneId: 'rooftops',
    fadeInStart: 0.1,
    fadeInEnd: 0.22,
    fadeOutStart: 0.82,
    fadeOutEnd: 0.96,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.rooftops.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.rooftops.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.rooftops.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.rooftops.rightTitle',
    },
  },
  {
    sceneId: 'wallsApproach',
    fadeInStart: 0.08,
    fadeInEnd: 0.2,
    fadeOutStart: 0.8,
    fadeOutEnd: 0.94,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.wallsApproach.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.wallsApproach.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.wallsApproach.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.wallsApproach.rightTitle',
    },
  },
  {
    sceneId: 'wallLaunch',
    fadeInStart: 0.08,
    fadeInEnd: 0.2,
    fadeOutStart: 0.8,
    fadeOutEnd: 0.94,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.wallLaunch.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.wallLaunch.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.wallLaunch.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.wallLaunch.rightTitle',
    },
  },
  {
    sceneId: 'titanCorridor',
    fadeInStart: 0.08,
    fadeInEnd: 0.2,
    fadeOutStart: 0.8,
    fadeOutEnd: 0.94,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.titanCorridor.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.titanCorridor.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.titanCorridor.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.titanCorridor.rightTitle',
    },
  },
  {
    sceneId: 'coupleStrike',
    fadeInStart: 0.06,
    fadeInEnd: 0.18,
    fadeOutStart: 0.42,
    fadeOutEnd: 0.52,
    left: {
      eyebrowKey: 'landing.cinematic.scenes.coupleStrike.leftEyebrow',
      titleKey: 'landing.cinematic.scenes.coupleStrike.leftTitle',
    },
    right: {
      eyebrowKey: 'landing.cinematic.scenes.coupleStrike.rightEyebrow',
      titleKey: 'landing.cinematic.scenes.coupleStrike.rightTitle',
    },
  },
] as const;

/** Returns caption config for a scene id, if any. */
export function getSceneCaptionConfig(
  sceneId: OperationRavennaSceneId,
): SceneCaptionConfig | undefined {
  return CINEMATIC_SCENE_CAPTIONS.find((entry) => entry.sceneId === sceneId);
}
