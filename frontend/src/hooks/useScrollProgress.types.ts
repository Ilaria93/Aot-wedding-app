import type { RefObject } from 'react';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

type ScrubbableTimeline = {
  progress: (value?: number) => number | void;
};

export type UseScrollProgressOptions = {
  /** When false, scroll tracking is disabled and progress stays at 0. */
  enabled?: boolean;
  /** Pinned scroll length in pixels before the hero unpins. */
  scrollDistance?: number;
  /** Optional scroll container ref; defaults to window scroll when omitted. */
  scrollerRef?: RefObject<HTMLElement | null>;
  /** Optional GSAP timeline scrubbed in sync with scroll progress. */
  timelineRef?: RefObject<ScrubbableTimeline | null>;
};

export type UseScrollProgressResult = {
  /** Normalized scroll progress in the range [0, 1]. */
  progress: number;
  /** Mutable progress for high-frequency consumers (e.g. R3F useFrame). */
  progressRef: RefObject<number>;
  /** Attach to the hero section that should be pinned. */
  heroRef: RefObject<HTMLDivElement | null>;
  /** Active ScrollTrigger instance. */
  scrollTriggerRef: RefObject<ScrollTrigger | null>;
  /** Re-measures scroll bounds after layout changes. */
  refreshScrollTrigger?: () => void;
};
