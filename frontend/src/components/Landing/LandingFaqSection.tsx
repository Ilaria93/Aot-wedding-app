import { Compass, Map, Shield } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';

/** Landing FAQ section with decorative tags. */
export function LandingFaqSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-section--dark obw-section--center obw-fade-up" id="faq">
      <p className="obw-kicker obw-kicker--light">{t('landing.faq.eyebrow')}</p>
      <h2 className="obw-display obw-display--light">{t('landing.faq.title')}</h2>
      <div className="obw-rule obw-rule--center" aria-hidden="true" />
      <div className="obw-faq-list">
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.locationQuestion')}</h3>
          <p>{t('landing.faq.locationAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.foodQuestion')}</h3>
          <p>{t('landing.faq.foodAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.phoneQuestion')}</h3>
          <p>{t('landing.faq.phoneAnswer')}</p>
        </article>
      </div>
      <div className="obw-tag-row">
        <span className="obw-tag">
          <Shield size={14} aria-hidden />
          {t('landing.decorative.wings')}
        </span>
        <span className="obw-tag">
          <Compass size={14} aria-hidden />
          {t('landing.decorative.mission')}
        </span>
        <span className="obw-tag">
          <Map size={14} aria-hidden />
          {t('landing.decorative.routes')}
        </span>
      </div>
    </section>
  );
}
