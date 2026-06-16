import type { LayoutChangeEvent, ScrollView } from 'react-native';
import type { RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeroCanvas } from '@/components/cinematic/HeroCanvas';
import { WeddingCountdownOverlay } from '@/components/cinematic/WeddingCountdownOverlay';
import { WhiteFlashOverlay } from '@/components/cinematic/WhiteFlashOverlay';
import { aotTheme } from '@/constants/aotTheme';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  WEDDING_COUPLE_NAMES,
  WEDDING_OPERATION_NAME,
  formatWeddingTrailerDate,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { useCoupleStrikeSequence } from '@/hooks/useCoupleStrikeSequence';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useWeddingCountdown } from '@/hooks/useWeddingCountdown';
import { resolveCountdownTransitionVisuals } from '@/utils/countdownTransitionVisuals';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

type CinematicHeroSectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollerRef?: RefObject<ScrollView | null>;
};

function padCountdownUnit(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Full-bleed cinematic hero with WebGL backdrop, trailer date and live countdown (web only).
 */
export function CinematicHeroSection({ onLayout, scrollerRef }: CinematicHeroSectionProps) {
  const { locale, t } = useI18n();
  const countdown = useWeddingCountdown();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, heroRef } = useScrollProgress({ scrollerRef });
  const strikeSequence = useCoupleStrikeSequence(progress);

  const sceneState = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, progress);
  const isCountdownTransition = sceneState.sceneId === 'countdownTransition';
  const transitionVisuals = isCountdownTransition
    ? resolveCountdownTransitionVisuals(sceneState.localProgress, {
        reduceMotion: prefersReducedMotion,
      })
    : { flashOpacity: 0, overlayOpacity: 0, showOverlay: false };

  const flashOpacity = Math.max(
    transitionVisuals.flashOpacity,
    prefersReducedMotion ? 0 : strikeSequence.flashIntensity * 0.92,
  );

  const showBottomHud = !isCountdownTransition;

  return (
    <View ref={heroRef} style={styles.section} onLayout={onLayout}>
      <HeroCanvas progress={progress} />

      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrimBottom} pointerEvents="none" />

      {showBottomHud ? (
        <View style={styles.overlay}>
          <Text style={styles.eyebrow}>{WEDDING_OPERATION_NAME}</Text>
          <Text style={styles.coupleNames}>{WEDDING_COUPLE_NAMES}</Text>
          <Text style={styles.trailerDate}>{formatWeddingTrailerDate(locale)}</Text>

          <View style={styles.countdownRow} accessibilityRole="timer">
            <Text style={styles.countdownUnit}>
              {padCountdownUnit(countdown.days)}
              <Text style={styles.countdownLabel}>{t('landing.cinematic.days')}</Text>
            </Text>
            <Text style={styles.countdownSeparator}>
              {t('landing.cinematic.countdownSeparator')}
            </Text>
            <Text style={styles.countdownUnit}>
              {padCountdownUnit(countdown.hours)}
              <Text style={styles.countdownLabel}>{t('landing.cinematic.hours')}</Text>
            </Text>
            <Text style={styles.countdownSeparator}>
              {t('landing.cinematic.countdownSeparator')}
            </Text>
            <Text style={styles.countdownUnit}>
              {padCountdownUnit(countdown.minutes)}
              <Text style={styles.countdownLabel}>{t('landing.cinematic.minutes')}</Text>
            </Text>
            <Text style={styles.countdownSeparator}>
              {t('landing.cinematic.countdownSeparator')}
            </Text>
            <Text style={styles.countdownUnit}>
              {padCountdownUnit(countdown.seconds)}
              <Text style={styles.countdownLabel}>{t('landing.cinematic.seconds')}</Text>
            </Text>
          </View>
        </View>
      ) : null}

      <WhiteFlashOverlay opacity={flashOpacity} />
      <WeddingCountdownOverlay
        opacity={transitionVisuals.overlayOpacity}
        visible={transitionVisuals.showOverlay}
      />

      <Text style={styles.scrollHint}>{t('landing.cinematic.scrollHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    minHeight: '100vh' as unknown as number,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1a211d',
  },
  scrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 33, 29, 0.35)',
  },
  scrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(26, 33, 29, 0.72)',
  },
  overlay: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 72,
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
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  trailerDate: {
    color: 'rgba(249, 248, 243, 0.88)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 22,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  countdownUnit: {
    color: aotTheme.surface,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    color: 'rgba(249, 248, 243, 0.72)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
  },
  countdownSeparator: {
    color: 'rgba(184, 138, 82, 0.9)',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
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
