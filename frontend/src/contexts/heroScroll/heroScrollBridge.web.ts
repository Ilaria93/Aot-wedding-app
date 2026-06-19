type ScrollNotifyListener = () => void;

let scrollNotifyListener: ScrollNotifyListener | null = null;

/** Registers a callback that re-measures GSAP ScrollTrigger on native scroll events. */
export function setHeroScrollNotifyListener(listener: ScrollNotifyListener | null): void {
  scrollNotifyListener = listener;
}

/** Notifies the hero scroll hook that the ScrollView moved (web landing). */
export function notifyHeroScroll(): void {
  scrollNotifyListener?.();
}
