import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP);

type UseGsapTimelineOptions = {
  enabled?: boolean;
};

/**
 * Returns a GSAP timeline ref scoped to a DOM container — ready for scroll-driven hero animations.
 */
export function useGsapTimeline({ enabled = true }: UseGsapTimelineOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!enabled || !containerRef.current) {
        return;
      }

      timelineRef.current?.kill();
      timelineRef.current = gsap.timeline({ paused: true });
    },
    { scope: containerRef, dependencies: [enabled] },
  );

  return { containerRef, timelineRef };
}
