import type { LayoutChangeEvent, ScrollView } from 'react-native';
import type { ReactNode, RefObject } from 'react';

type CinematicHeroSectionProps = {
  onLayout?: (event: LayoutChangeEvent) => void;
  scrollerRef?: RefObject<ScrollView | null>;
  navbarOverlay?: ReactNode;
};

/** Native stub — cinematic hero is web-only for now. */
export function CinematicHeroSection(_props: CinematicHeroSectionProps) {
  return null;
}
