import { useI18n } from '@/contexts/I18nContext';

/** Placeholder until the cinematic R3F hero is ported from feature/cinematic-hero. */
export function HeroPlaceholder() {
  const { t } = useI18n();

  return (
    <section className="hero-placeholder" aria-label="Hero">
      <div>
        <p className="hero-placeholder__eyebrow">{t('landing.hero.eyebrow')}</p>
        <h1 className="hero-placeholder__title">ILARIA & DAVIDE</h1>
        <p className="hero-placeholder__note">
          Cinematic hero 3D in arrivo — questa build web è pronta per Operation Ravenna.
        </p>
      </div>
    </section>
  );
}
