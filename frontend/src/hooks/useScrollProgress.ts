import { useRef, useState } from 'react';
import type { View } from 'react-native';

import type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';

export type { UseScrollProgressOptions, UseScrollProgressResult } from '@/hooks/useScrollProgress.types';

/**
 * Native stub — GSAP ScrollTrigger scroll progress is web-only for now.
 */
export function useScrollProgress(
  _options: UseScrollProgressOptions = {},
): UseScrollProgressResult {
  const heroRef = useRef<View | null>(null);
  const progressRef = useRef(0);
  const scrollTriggerRef = useRef(null);
  const [progress] = useState(0);

  return { progress, progressRef, heroRef, scrollTriggerRef };
}
