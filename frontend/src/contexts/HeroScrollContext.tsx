import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { isCinematicHeroEnabled } from '@/constants/cinematicHero';

type HeroScrollContextValue = {
  /** Normalized hero scroll progress in [0, 1]. */
  progress: number;
  /** True when the visitor skipped the pinned cinematic intro. */
  isIntroSkipped: boolean;
  /** True while the pinned cinematic hero is actively scrubbing (web landing). */
  isHeroScrollActive: boolean;
  setHeroScrollProgress: (progress: number) => void;
  setHeroIntroSkipped: (skipped: boolean) => void;
  resetHeroScroll: () => void;
};

const HeroScrollContext = createContext<HeroScrollContextValue | undefined>(undefined);

/** Whether the bottom tab bar should hide during the cinematic hero scrub. */
export function isHeroScrollActiveProgress(progress: number, isIntroSkipped = false): boolean {
  if (isIntroSkipped) {
    return false;
  }

  return progress < 1;
}

/**
 * Shares cinematic hero scroll progress between the landing hero and tab chrome.
 */
export function HeroScrollProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [isIntroSkipped, setIsIntroSkipped] = useState(false);

  const setHeroScrollProgress = useCallback((nextProgress: number) => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    setProgress(clamped);
  }, []);

  const setHeroIntroSkipped = useCallback((skipped: boolean) => {
    setIsIntroSkipped(skipped);
  }, []);

  const resetHeroScroll = useCallback(() => {
    setProgress(0);
    setIsIntroSkipped(false);
  }, []);

  const value = useMemo<HeroScrollContextValue>(
    () => ({
      progress,
      isIntroSkipped,
      isHeroScrollActive: isCinematicHeroEnabled()
        ? isHeroScrollActiveProgress(progress, isIntroSkipped)
        : false,
      setHeroScrollProgress,
      setHeroIntroSkipped,
      resetHeroScroll,
    }),
    [isIntroSkipped, progress, resetHeroScroll, setHeroIntroSkipped, setHeroScrollProgress],
  );

  return <HeroScrollContext.Provider value={value}>{children}</HeroScrollContext.Provider>;
}

/** Reads cinematic hero scroll state for tab bar visibility and overlays. */
export function useHeroScroll(): HeroScrollContextValue {
  const context = useContext(HeroScrollContext);
  if (!context) {
    throw new Error('useHeroScroll must be used within HeroScrollProvider');
  }
  return context;
}
