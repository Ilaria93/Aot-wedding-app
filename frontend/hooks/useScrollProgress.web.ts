import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useRef, useState } from 'react';
import type { View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import { resolveHeroScrollDistance } from '@/constants/heroScroll';
import type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';
import { getScrollableElement } from '@/utils/getScrollableElement';

export type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
 */
export function useScrollProgress({
  enabled = true,
  scrollDistance,
  scrollerRef,
  timelineRef,
}: UseScrollProgressOptions = {}): UseScrollProgressResult {
  const heroRef = useRef<View | null>(null);
  const progressRef = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const [progress, setProgress] = useState(0);

  const applyProgress = useCallback((nextProgress: number) => {
    const clamped = clampProgress(nextProgress);
    progressRef.current = clamped;
    setProgress(clamped);
    timelineRef?.current?.progress(clamped);
  }, [timelineRef]);

  useGSAP(
    () => {
      const heroElement = heroRef.current as unknown as HTMLElement | null;
      if (!enabled || !heroElement) {
        return;
      }

      const scroller = scrollerRef ? getScrollableElement(scrollerRef.current) : undefined;

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
          pinType: 'transform',
        });
      }

      scrollTriggerRef.current?.kill();

      const resolvedScrollDistance = resolveHeroScrollDistance(scrollDistance);

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: heroElement,
        scroller: scroller ?? window,
        start: 'top top',
        end: `+=${resolvedScrollDistance}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          applyProgress(self.progress);
        },
      });

      stylePinSpacer(heroElement);
      ScrollTrigger.refresh();

      return () => {
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
      dependencies: [enabled, scrollDistance, scrollerRef, applyProgress],
    },
  );

  return { progress, progressRef, heroRef, scrollTriggerRef };
}
