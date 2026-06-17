import { useEffect, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';
import type { ReactNode, RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BlackoutCountdownOverlay } from '@/components/cinematic/BlackoutCountdownOverlay';
import { CameraPathEditorOverlay } from '@/components/cinematic/CameraPathEditorOverlay';
import { CinematicSceneCaptions } from '@/components/cinematic/CinematicSceneCaptions';
import { HeroCanvas } from '@/components/cinematic/HeroCanvas';
import { OperationRavennaDebugOverlay } from '@/components/cinematic/OperationRavennaDebugOverlay';
import { WhiteFlashOverlay } from '@/components/cinematic/WhiteFlashOverlay';
import { aotTheme } from '@/constants/aotTheme';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  WEDDING_COUPLE_NAMES,
  WEDDING_OPERATION_NAME,
  formatWeddingTrailerDate,
} from '@/constants/weddingEvent';
import { useHeroScroll } from '@/contexts/HeroScrollContext';
import { useI18n } from '@/contexts/I18nContext';
import { HERO_VISIBLE_VIEWPORT_RATIO } from '@/constants/heroScroll';
import { useCameraPathEditorHelpers } from '@/hooks/useCameraPathEditorHelpers';
import { useCoupleStrikeSequence } from '@/hooks/useCoupleStrikeSequence';
import { useOperationRavennaDebugOverlay } from '@/hooks/useOperationRavennaDebugOverlay';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { createEmptyCameraDebugSnapshot } from '@/types/cinematicDebug';
import { resolveCountdownTransitionVisuals } from '@/utils/countdownTransitionVisuals';
import { resolveSceneCaptionVisuals } from '@/utils/sceneCaptionVisuals';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

type CinematicHeroSectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollerRef?: RefObject<ScrollView | null>;
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

  function handleHeroLayout(event: LayoutChangeEvent) {
    onLayout?.(event);
    refreshScrollTrigger?.();
  }

  return (
    <View ref={heroRef} style={styles.pinnedShell} onLayout={handleHeroLayout}>
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

      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrimBottom} pointerEvents="none" />

      {navbarOverlay ? (
        <View style={styles.navbarOverlay} pointerEvents="box-none">
          {navbarOverlay}
        </View>
      ) : null}

      <CinematicSceneCaptions visuals={captionVisuals} translate={t} />

      {showIntroHud ? (
        <View style={styles.overlay}>
          <Text style={styles.eyebrow}>{WEDDING_OPERATION_NAME}</Text>
          <Text style={styles.coupleNames}>{WEDDING_COUPLE_NAMES}</Text>
          <Text style={styles.trailerDate}>{formatWeddingTrailerDate(locale)}</Text>
        </View>
      ) : null}

      <WhiteFlashOverlay opacity={flashOpacity} />
      <BlackoutCountdownOverlay
        visible={transitionVisuals.showOverlay}
        blackoutOpacity={transitionVisuals.blackoutOpacity}
        metaOpacity={transitionVisuals.metaOpacity}
        countdownOpacity={transitionVisuals.countdownOpacity}
      />

      {showScrollHint ? (
        <Text style={styles.scrollHint}>{t('landing.cinematic.scrollHint')}</Text>
      ) : null}
    </View>
  );
}

const heroVisibleHeight = `${Math.round(HERO_VISIBLE_VIEWPORT_RATIO * 100)}vh`;

const styles = StyleSheet.create({
  pinnedShell: {
    width: '100vw' as unknown as number,
    height: heroVisibleHeight as unknown as number,
    minHeight: heroVisibleHeight as unknown as number,
    alignSelf: 'center',
    marginHorizontal: -20,
    position: 'relative',
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#1a211d',
  },
  navbarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 33, 29, 0.28)',
  },
  scrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: 'rgba(26, 33, 29, 0.58)',
  },
  overlay: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 52,
    zIndex: 2,
  },
  eyebrow: {
    color: aotTheme.bronze,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  coupleNames: {
    color: aotTheme.surface,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  trailerDate: {
    color: 'rgba(249, 248, 243, 0.88)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(249, 248, 243, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    zIndex: 2,
  },
});
