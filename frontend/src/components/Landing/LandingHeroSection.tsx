import { useI18n } from '@/contexts/I18nContext';

type LandingHeroSectionProps = {
  onScrollToRsvp: () => void;
};

/** Landing hero with couple names and primary CTA. */
export function LandingHeroSection({ onScrollToRsvp }: LandingHeroSectionProps) {
  const { t } = useI18n();

  return (
    <section className="landing-hero" id="story">
      <div className="landing-hero__blob landing-hero__blob--top" aria-hidden />
      <div className="landing-hero__blob landing-hero__blob--bottom" aria-hidden />
      <div className="landing-hero__inner">
        <p className="landing-hero__eyebrow">{t('landing.hero.eyebrow')}</p>
        <h1 className="landing-hero__name">DAVIDE</h1>
        <p className="landing-hero__ampersand">&</p>
        <h1 className="landing-hero__name">ILARIA</h1>
        <button type="button" className="landing-hero__button" onClick={onScrollToRsvp}>
          {t('landing.hero.button')}
        </button>
      </div>
    </section>
  );
}
