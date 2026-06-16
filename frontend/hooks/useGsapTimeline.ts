/** Native stub — GSAP scroll timeline is web-only for now. */
export function useGsapTimeline() {
  return { containerRef: { current: null }, timelineRef: { current: null } };
}
