import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

import { BlackoutCountdownOverlay } from '@/components/cinematic/BlackoutCountdownOverlay';
import { CameraPathEditorOverlay } from '@/components/cinematic/CameraPathEditorOverlay';
import { CinematicSceneCaptions } from '@/components/cinematic/CinematicSceneCaptions';
import { HeroCanvas } from '@/components/cinematic/HeroCanvas';
import { OperationRavennaDebugOverlay } from '@/components/cinematic/OperationRavennaDebugOverlay';
import { WhiteFlashOverlay } from '@/components/cinematic/WhiteFlashOverlay';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  WEDDING_COUPLE_NAMES,
  WEDDING_OPERATION_NAME,
  formatWeddingTrailerDate,
} from '@/constants/weddingEvent';
import { useHeroScroll } from '@/contexts/HeroScrollContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import { useCameraPathEditorHelpers } from '@/hooks/useCameraPathEditorHelpers';
import { useCoupleStrikeSequence } from '@/hooks/useCoupleStrikeSequence';
import { useOperationRavennaDebugOverlay } from '@/hooks/useOperationRavennaDebugOverlay';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { createEmptyCameraDebugSnapshot } from '@/types/cinematicDebug';
import { resolveCountdownTransitionVisuals } from '@/utils/countdownTransitionVisuals';
import { resolveSceneCaptionVisuals } from '@/utils/sceneCaptionVisuals';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';
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
  const { locale, t } = useI18n();
  const { setHeroScrollProgress, resetHeroScroll } = useHeroScroll();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, progressRef, heroRef, refreshScrollTrigger } = useScrollProgress({ scrollerRef });
  const debugOverlayVisible = useOperationRavennaDebugOverlay();
  const cameraPathHelpersVisible = useCameraPathEditorHelpers();
  const cameraDebugRef = useRef(createEmptyCameraDebugSnapshot());
  const strikeSequence = useCoupleStrikeSequence(progress);

  useEffect(() => {
    setHeroScrollProgress(progress);
  }, [progress, setHeroScrollProgress]);

  useEffect(() => resetHeroScroll, [resetHeroScroll]);

  const sceneState = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, progress);
  const captionVisuals = resolveSceneCaptionVisuals(sceneState);
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

  const showIntroHud =
    !isCountdownTransition && progress < 0.12 && captionVisuals.opacity <= 0;
  const showScrollHint = progress < 0.04 && !isCountdownTransition;

  function translateCaption(key: string): string {
    return t(key as TranslationKey);
  }

  useLayoutEffect(() => {
    onLayout?.();
    refreshScrollTrigger?.();
  }, [onLayout, refreshScrollTrigger]);

  return (
    <div ref={heroRef} className="cinematic-hero">
      <HeroCanvas
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
      <div className="cinematic-hero__scrim-bottom" aria-hidden />

      {navbarOverlay ? <div className="cinematic-hero__navbar">{navbarOverlay}</div> : null}

      <CinematicSceneCaptions visuals={captionVisuals} translate={translateCaption} />

      {showIntroHud ? (
        <div className="cinematic-hero__overlay">
          <p className="cinematic-hero__eyebrow">{WEDDING_OPERATION_NAME}</p>
          <h1 className="cinematic-hero__couple-names">{WEDDING_COUPLE_NAMES}</h1>
          <p className="cinematic-hero__trailer-date">{formatWeddingTrailerDate(locale)}</p>
        </div>
      ) : null}

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
    </div>
  );
}
