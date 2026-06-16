import type { LayoutChangeEvent, ScrollView } from 'react-native';
import type { RefObject } from 'react';

type CinematicHeroSectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollerRef?: RefObject<ScrollView | null>;
};

/** Native stub — cinematic hero is web-only for now. */
export function CinematicHeroSection(_props: CinematicHeroSectionProps) {
  return null;
}
