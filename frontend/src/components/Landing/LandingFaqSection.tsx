import { Compass, Map, Shield } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';

/** Landing FAQ section with decorative pills. */
export function LandingFaqSection() {
  const { t } = useI18n();

  return (
    <section className="landing-faq">
      <p className="landing-faq__eyebrow">{t('landing.faq.eyebrow')}</p>
      <h2 className="landing-faq__title">{t('landing.faq.title')}</h2>
      <div className="landing-faq__list">
        <article className="landing-faq__item">
          <h3>{t('landing.faq.locationQuestion')}</h3>
          <p>{t('landing.faq.locationAnswer')}</p>
        </article>
        <article className="landing-faq__item">
          <h3>{t('landing.faq.foodQuestion')}</h3>
          <p>{t('landing.faq.foodAnswer')}</p>
        </article>
        <article className="landing-faq__item">
          <h3>{t('landing.faq.phoneQuestion')}</h3>
          <p>{t('landing.faq.phoneAnswer')}</p>
        </article>
      </div>
      <div className="landing-faq__pills">
        <span className="landing-faq__pill">
          <Shield size={16} color="var(--aot-bronze)" aria-hidden />
          {t('landing.decorative.wings')}
        </span>
        <span className="landing-faq__pill">
          <Compass size={16} color="var(--aot-bronze)" aria-hidden />
          {t('landing.decorative.mission')}
        </span>
        <span className="landing-faq__pill">
          <Map size={16} color="var(--aot-bronze)" aria-hidden />
          {t('landing.decorative.routes')}
        </span>
      </div>
    </section>
  );
}
