import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useRef, useState } from 'react';

import { aotTheme } from '@/constants/aotTheme';
import { resolveHeroSkipScrollTop } from '@/constants/heroSkip';
import { resolveHeroScrollDistance } from '@/constants/heroScroll';
import { useHeroScroll } from '@/contexts/HeroScrollContext';
import type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';
import { getScrollableElement } from '@/contexts/heroScroll/getScrollableElement';
import { setHeroScrollNotifyListener } from '@/contexts/heroScroll/heroScrollBridge';

export type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** GSAP scrub smoothing in seconds — reduces jitter between scroll steps. */
const SCROLL_SCRUB_SMOOTHING = 0.45;

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function stylePinSpacer(heroElement: HTMLElement): void {
  const pinSpacer = heroElement.parentElement;
  if (!pinSpacer?.classList.contains('pin-spacer')) {
    return;
  }

  pinSpacer.style.backgroundColor = aotTheme.cinematicBackground;
}

/**
 * Pins the hero section and maps scroll position to a normalized [0, 1] progress value.
 * While pinned, scroll scrubs the 3D cinematic; after progress reaches 1 the page continues below.
 */
export function useScrollProgress({
  enabled = true,
  scrollDistance,
  scrollerRef,
  timelineRef,
}: UseScrollProgressOptions = {}): UseScrollProgressResult {
  const { isIntroSkipped, setHeroIntroSkipped } = useHeroScroll();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [setupToken, setSetupToken] = useState(0);

  const flushProgressToReact = useCallback(() => {
    progressRafRef.current = null;
    setProgress(progressRef.current);
  }, []);

  const applyProgress = useCallback(
    (nextProgress: number) => {
      const clamped = clampProgress(nextProgress);
      progressRef.current = clamped;
      timelineRef?.current?.progress(clamped);

      if (progressRafRef.current !== null) {
        return;
      }

      progressRafRef.current = window.requestAnimationFrame(flushProgressToReact);
    },
    [flushProgressToReact, timelineRef],
  );

  const refreshScrollTrigger = useCallback(() => {
    scrollTriggerRef.current?.update();
    ScrollTrigger.refresh();
  }, []);

  const requestScrollSetup = useCallback(() => {
    setSetupToken((current) => current + 1);
  }, []);

  const skipHeroIntro = useCallback(() => {
    const scrollTrigger = scrollTriggerRef.current;

    if (scrollTrigger) {
      const scrollTop = resolveHeroSkipScrollTop(scrollTrigger.start, scrollTrigger.end);
      scrollTrigger.scroll(scrollTop);
    }

    applyProgress(1);
    setHeroIntroSkipped(true);
    ScrollTrigger.update();
  }, [applyProgress, setHeroIntroSkipped]);

  const resumeHeroIntro = useCallback(() => {
    setHeroIntroSkipped(false);
    applyProgress(0);
    requestScrollSetup();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [applyProgress, requestScrollSetup, setHeroIntroSkipped]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 120);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (progressRafRef.current !== null) {
        window.cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !scrollerRef) {
      return undefined;
    }

    let frameId = 0;
    let cancelled = false;

    const waitForScroller = () => {
      if (cancelled) {
        return;
      }

      if (getScrollableElement(scrollerRef.current)) {
        requestScrollSetup();
        return;
      }

      frameId = window.requestAnimationFrame(waitForScroller);
    };

    waitForScroller();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled, scrollerRef, requestScrollSetup]);

  useEffect(() => {
    if (!enabled || !scrollerRef) {
      return undefined;
    }

    const scroller = getScrollableElement(scrollerRef.current);
    if (!scroller || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 120);
    });

    observer.observe(scroller);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [enabled, scrollerRef, setupToken]);

  useGSAP(
    () => {
      const heroElement = heroRef.current;
      if (!enabled || !heroElement) {
        return undefined;
      }

      if (isIntroSkipped) {
        scrollTriggerRef.current?.kill();
        scrollTriggerRef.current = null;
        applyProgress(1);
        return undefined;
      }

      const scroller = scrollerRef ? getScrollableElement(scrollerRef.current) : undefined;
      if (scrollerRef && !scroller) {
        return undefined;
      }

      if (scroller) {
        ScrollTrigger.scrollerProxy(scroller, {
          scrollTop(value) {
            if (arguments.length) {
              scroller.scrollTop = value ?? 0;
            }
            return scroller.scrollTop;
          },
          getBoundingClientRect() {
            return {
              top: 0,
              left: 0,
              width: scroller.clientWidth,
              height: scroller.clientHeight,
            };
          },
          pinType:
            scroller === document.body || scroller === document.documentElement ? 'fixed' : 'transform',
        });
      }

      scrollTriggerRef.current?.kill();

      const resolvedScrollDistance = resolveHeroScrollDistance(scrollDistance);
      const scrollTarget = scroller ?? window;

      const updateScrollTrigger = () => {
        scrollTriggerRef.current?.update();
      };

      setHeroScrollNotifyListener(updateScrollTrigger);

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: heroElement,
        scroller: scrollTarget,
        start: 'top top',
        end: `+=${resolvedScrollDistance}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 0,
        scrub: SCROLL_SCRUB_SMOOTHING,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyProgress(self.progress);
        },
      });

      stylePinSpacer(heroElement);
      ScrollTrigger.refresh();
      applyProgress(scrollTriggerRef.current.progress);

      const handleScroll = () => {
        updateScrollTrigger();
      };

      if (scrollTarget instanceof Window) {
        window.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
      }

      return () => {
        setHeroScrollNotifyListener(null);

        if (scrollTarget instanceof Window) {
          window.removeEventListener('scroll', handleScroll);
        } else {
          scrollTarget.removeEventListener('scroll', handleScroll);
        }

        scrollTriggerRef.current?.kill();
        scrollTriggerRef.current = null;

        if (scroller) {
          ScrollTrigger.scrollerProxy(scroller);
        }

        progressRef.current = 0;
        setProgress(0);
        ScrollTrigger.refresh();
      };
    },
    {
      scope: heroRef,
      dependencies: [enabled, scrollDistance, scrollerRef, applyProgress, setupToken, isIntroSkipped],
    },
  );

  return {
    progress,
    progressRef,
    heroRef,
    scrollTriggerRef,
    refreshScrollTrigger,
    skipHeroIntro,
    resumeHeroIntro,
  };
}
