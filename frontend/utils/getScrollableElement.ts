import type { ScrollView } from 'react-native';

type ScrollableHost = ScrollView | HTMLElement | null | undefined;

/** Native stub — DOM scroll resolution is web-only. */
export function getScrollableElement(_host: ScrollableHost): HTMLElement | undefined {
  return undefined;
}
