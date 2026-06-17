import { getSceneCaptionConfig } from '@/constants/cinematicSceneCaptions';
import type { OperationRavennaSceneId } from '@/types/scene';
import type { SceneTimelineState } from '@/types/sceneTimeline';

export type SceneCaptionVisuals = {
  opacity: number;
  leftEyebrowKey: string | null;
  leftTitleKey: string | null;
  rightEyebrowKey: string | null;
  rightTitleKey: string | null;
  impactTaglineKey: string | null;
  impactTaglineOpacity: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

function resolveCaptionOpacity(
  localProgress: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number,
): number {
  if (localProgress < fadeInStart || localProgress > fadeOutEnd) {
    return 0;
  }

  if (localProgress < fadeInEnd) {
    const span = fadeInEnd - fadeInStart;
    if (span <= 0) {
      return 1;
    }
    return easeOutCubic((localProgress - fadeInStart) / span);
  }

  if (localProgress > fadeOutStart) {
    const span = fadeOutEnd - fadeOutStart;
    if (span <= 0) {
      return 0;
    }
    return 1 - easeOutCubic((localProgress - fadeOutStart) / span);
  }

  return 1;
}

function resolveImpactTaglineOpacity(sceneId: OperationRavennaSceneId, localProgress: number): number {
  if (sceneId !== 'coupleStrike') {
    return 0;
  }

  const peak = 0.82;
  const halfWidth = 0.06;
  const distance = Math.abs(localProgress - peak);

  if (distance >= halfWidth) {
    return 0;
  }

  return easeOutCubic(1 - distance / halfWidth);
}

/**
 * Maps active scene state to side-caption opacity and i18n keys.
 */
export function resolveSceneCaptionVisuals(sceneState: SceneTimelineState): SceneCaptionVisuals {
  const empty: SceneCaptionVisuals = {
    opacity: 0,
    leftEyebrowKey: null,
    leftTitleKey: null,
    rightEyebrowKey: null,
    rightTitleKey: null,
    impactTaglineKey: null,
    impactTaglineOpacity: 0,
  };

  if (sceneState.sceneId === 'countdownTransition') {
    return empty;
  }

  const config = getSceneCaptionConfig(sceneState.sceneId);
  if (!config) {
    return empty;
  }

  const opacity = resolveCaptionOpacity(
    sceneState.localProgress,
    config.fadeInStart,
    config.fadeInEnd,
    config.fadeOutStart,
    config.fadeOutEnd,
  );

  const impactTaglineOpacity = resolveImpactTaglineOpacity(
    sceneState.sceneId,
    sceneState.localProgress,
  );

  return {
    opacity,
    leftEyebrowKey: config.left.eyebrowKey,
    leftTitleKey: config.left.titleKey,
    rightEyebrowKey: config.right.eyebrowKey,
    rightTitleKey: config.right.titleKey,
    impactTaglineKey:
      impactTaglineOpacity > 0 ? 'landing.cinematic.scenes.coupleStrike.impactTagline' : null,
    impactTaglineOpacity,
  };
}
