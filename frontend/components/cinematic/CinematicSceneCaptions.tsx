import type { SceneCaptionVisuals } from '@/utils/sceneCaptionVisuals';

type CinematicSceneCaptionsProps = {
  visuals: SceneCaptionVisuals;
  translate: (key: string) => string;
};

/** Native stub — scroll captions are web-only. */
export function CinematicSceneCaptions(_props: CinematicSceneCaptionsProps) {
  return null;
}
