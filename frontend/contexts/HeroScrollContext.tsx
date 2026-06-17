import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

type HeroScrollContextValue = {
  /** Normalized hero scroll progress in [0, 1]. */
  progress: number;
  /** True while the pinned cinematic hero is actively scrubbing (web landing). */
  isHeroScrollActive: boolean;
  setHeroScrollProgress: (progress: number) => void;
  resetHeroScroll: () => void;
};

const HeroScrollContext = createContext<HeroScrollContextValue | undefined>(undefined);

/** Whether the bottom tab bar should hide during the cinematic hero scrub. */
export function isHeroScrollActiveProgress(progress: number): boolean {
  return progress < 1;
}

/**
 * Shares cinematic hero scroll progress between the landing hero and tab chrome.
 */
export function HeroScrollProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);

  const setHeroScrollProgress = useCallback((nextProgress: number) => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    setProgress(clamped);
  }, []);

  const resetHeroScroll = useCallback(() => {
    setProgress(0);
  }, []);

  const value = useMemo<HeroScrollContextValue>(
    () => ({
      progress,
      isHeroScrollActive: isHeroScrollActiveProgress(progress),
      setHeroScrollProgress,
      resetHeroScroll,
    }),
    [progress, resetHeroScroll, setHeroScrollProgress],
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
