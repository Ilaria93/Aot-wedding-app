import type { ScrollView } from 'react-native';

type ScrollableHost = ScrollView | HTMLElement | null | undefined;

/**
 * Resolves a ScrollView ref (or raw HTMLElement) to the DOM node GSAP should scroll.
 */
export function getScrollableElement(host: ScrollableHost): HTMLElement | undefined {
  if (!host) {
    return undefined;
  }

  if (host instanceof HTMLElement) {
    return host;
  }

  const scrollView = host as ScrollView & {
    getScrollableNode?: () => HTMLElement;
    getInnerViewNode?: () => HTMLElement;
  };

  return scrollView.getScrollableNode?.() ?? scrollView.getInnerViewNode?.();
}
