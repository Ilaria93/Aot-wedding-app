import { HERO_COVER_IMAGE_URL } from '@/constants/heroCover';
import './styles/CinematicHeroCover.scss';

type CinematicHeroCoverProps = {
  opacity: number;
};

/** Full-bleed opening cover — cool-toned Ravenna artwork above the WebGL hero. */
export function CinematicHeroCover({ opacity }: CinematicHeroCoverProps) {
  return (
    <div
      className="cinematic-hero__cover"
      style={{
        opacity,
        visibility: opacity > 0 ? 'visible' : 'hidden',
      }}
      aria-hidden={opacity <= 0}>
      <img
        className="cinematic-hero__cover-image"
        src={HERO_COVER_IMAGE_URL}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <div className="cinematic-hero__cover-cool" />
      <div className="cinematic-hero__cover-vignette" />
    </div>
  );
}
