import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

import { BlackoutCountdownOverlay } from '@/cinematic/overlays/BlackoutCountdownOverlay';
import { CameraPathEditorOverlay } from '@/cinematic/debug/CameraPathEditorOverlay';
import { CinematicHeroCover } from '@/cinematic/hero/CinematicHeroCover';
import { CinematicSceneCaptions } from '@/cinematic/captions/CinematicSceneCaptions';
import { HeroCanvas } from '@/cinematic/hero/HeroCanvas';
import { OperationRavennaDebugOverlay } from '@/cinematic/debug/OperationRavennaDebugOverlay';
import { WhiteFlashOverlay } from '@/cinematic/overlays/WhiteFlashOverlay';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  HERO_COVER_RELEASE_END_PROGRESS,
  resolveHeroCanvasRevealOpacity,
  resolveHeroCoverOpacity,
} from '@/constants/heroScroll';
import { useHeroScroll } from '@/contexts/HeroScrollContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import { useCameraPathEditorHelpers } from '@/cinematic/debug/useCameraPathEditorHelpers';
import { useCoupleStrikeSequence } from '@/hooks/useCoupleStrikeSequence';
import { useOperationRavennaDebugOverlay } from '@/cinematic/debug/useOperationRavennaDebugOverlay';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { createEmptyCameraDebugSnapshot } from '@/types/cinematicDebug';
import { resolveCountdownTransitionVisuals } from '@/cinematic/timeline/countdownTransitionVisuals';
import { isOpeningUiHidden } from '@/cinematic/camera/openingCameraMotion';
import { resolveSceneCaptionVisuals } from '@/cinematic/timeline/sceneCaptionVisuals';
import { resolveSceneTimelineState } from '@/cinematic/timeline/sceneTimeline';
import './styles/CinematicHeroSection.scss';

type CinematicHeroSectionProps = {
  onLayout?: () => void;
  scrollerRef?: RefObject<HTMLElement | null>;
  /** Optional navbar rendered above the canvas during the pinned scroll-scrub. */
  navbarOverlay?: ReactNode;
};

/**
 * Full-viewport pinned hero: scroll scrubs a 3D cinematic (0→1), then releases into page content.
 */
export function CinematicHeroSection({
  onLayout,
  scrollerRef,
  navbarOverlay,
}: CinematicHeroSectionProps) {
  const { t } = useI18n();
  const { setHeroScrollProgress, resetHeroScroll, isIntroSkipped } = useHeroScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, progressRef, heroRef, refreshScrollTrigger, skipHeroIntro, resumeHeroIntro } =
    useScrollProgress({
      scrollerRef,
    });
  const debugOverlayVisible = useOperationRavennaDebugOverlay();
  const cameraPathHelpersVisible = useCameraPathEditorHelpers();
  const cameraDebugRef = useRef(createEmptyCameraDebugSnapshot());
  const strikeSequence = useCoupleStrikeSequence(progress);

  useEffect(() => {
    setHeroScrollProgress(progress);
  }, [progress, setHeroScrollProgress]);

  useEffect(() => resetHeroScroll, [resetHeroScroll]);

  const sceneState = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, progress);
  const openingUiHidden = isOpeningUiHidden(progress);
  const captionVisuals = resolveSceneCaptionVisuals(sceneState);
  const captionsHidden = openingUiHidden
    ? { ...captionVisuals, opacity: 0, leftTitleKey: null, rightTitleKey: null, impactTaglineKey: null, impactTaglineOpacity: 0 }
    : captionVisuals;
  const isCountdownTransition = sceneState.sceneId === 'countdownTransition';
  const transitionVisuals = isCountdownTransition
    ? resolveCountdownTransitionVisuals(sceneState.localProgress, {
        reduceMotion: prefersReducedMotion,
      })
    : {
        flashOpacity: 0,
        blackoutOpacity: 0,
        metaOpacity: 0,
        countdownOpacity: 0,
        showOverlay: false,
      };

  const flashOpacity = Math.max(
    transitionVisuals.flashOpacity,
    prefersReducedMotion ? 0 : strikeSequence.flashIntensity * 0.92,
  );

  const showScrollHint =
    progress < HERO_COVER_RELEASE_END_PROGRESS && !isCountdownTransition && !isIntroSkipped;
  const showSkipIntro = !isIntroSkipped && !isCountdownTransition && progress < 1;
  const coverOpacity = resolveHeroCoverOpacity(progress);
  const canvasOpacity = resolveHeroCanvasRevealOpacity(progress);

  function translateCaption(key: string): string {
    return t(key as TranslationKey);
  }

  useLayoutEffect(() => {
    onLayout?.();
    refreshScrollTrigger?.();
  }, [onLayout, refreshScrollTrigger]);

  return (
    <div
      ref={heroRef}
      className={`cinematic-hero${isIntroSkipped ? ' cinematic-hero--intro-skipped' : ''}`}>
      <CinematicHeroCover opacity={coverOpacity} />
      <HeroCanvas
        canvasOpacity={canvasOpacity}
        progress={progress}
        progressRef={progressRef}
        cameraDebugRef={cameraDebugRef}
        showCameraPathHelpers={__DEV__ ? cameraPathHelpersVisible : false}
      />

      {__DEV__ ? (
        <CameraPathEditorOverlay
          visible={cameraPathHelpersVisible}
          progressRef={progressRef}
          cameraDebugRef={cameraDebugRef}
        />
      ) : null}

      {__DEV__ ? (
        <OperationRavennaDebugOverlay
          visible={debugOverlayVisible}
          progressRef={progressRef}
          cameraDebugRef={cameraDebugRef}
        />
      ) : null}

      <div className="cinematic-hero__scrim-top" aria-hidden />

      {navbarOverlay && !openingUiHidden ? (
        <div className="cinematic-hero__navbar">{navbarOverlay}</div>
      ) : null}

      <CinematicSceneCaptions visuals={captionsHidden} translate={translateCaption} />

      <WhiteFlashOverlay opacity={flashOpacity} />
      <BlackoutCountdownOverlay
        visible={transitionVisuals.showOverlay}
        blackoutOpacity={transitionVisuals.blackoutOpacity}
        metaOpacity={transitionVisuals.metaOpacity}
        countdownOpacity={transitionVisuals.countdownOpacity}
      />

      {showScrollHint ? (
        <p className="cinematic-hero__scroll-hint">{t('landing.cinematic.scrollHint')}</p>
      ) : null}

      {showSkipIntro ? (
        <div className="cinematic-hero__skip">
          <button type="button" className="cinematic-hero__skip-button" onClick={skipHeroIntro}>
            {t('landing.cinematic.skipIntro')}
          </button>
        </div>
      ) : null}

      {isIntroSkipped ? (
        <div className="cinematic-hero__skip">
          <button type="button" className="cinematic-hero__skip-button" onClick={resumeHeroIntro}>
            {t('landing.cinematic.replayIntro')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
