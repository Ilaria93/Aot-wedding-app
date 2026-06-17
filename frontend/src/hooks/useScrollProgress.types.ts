import type { RefObject } from 'react';
import type { ScrollView, View } from 'react-native';
import type gsap from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export type UseScrollProgressOptions = {
  /** When false, scroll tracking is disabled and progress stays at 0. */
  enabled?: boolean;
  /** Pinned scroll length in pixels before the hero unpins. */
  scrollDistance?: number;
  /** Scroll container (e.g. ScrollView ref) or HTMLElement on web. */
  scrollerRef?: RefObject<ScrollView | HTMLElement | null>;
  /** Optional GSAP timeline scrubbed in sync with scroll progress. */
  timelineRef?: RefObject<gsap.core.Timeline | null>;
};

export type UseScrollProgressResult = {
  /** Normalized scroll progress in the range [0, 1]. */
  progress: number;
  /** Mutable progress for high-frequency consumers (e.g. R3F useFrame). */
  progressRef: RefObject<number>;
  /** Attach to the hero section that should be pinned. */
  heroRef: RefObject<View | null>;
  /** Active ScrollTrigger instance (web only). */
  scrollTriggerRef: RefObject<ScrollTrigger | null>;
  /** Re-measures scroll bounds after layout changes (web only). */
  refreshScrollTrigger?: () => void;
};
