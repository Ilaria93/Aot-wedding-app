import { WEDDING_LODGING, WEDDING_LODGING_HOTEL } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

/** Landing FAQ section. */
export function LandingFaqSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-section--dark obw-section--center obw-fade-up" id="faq">
      <p className="obw-kicker obw-kicker--light">{t('landing.faq.eyebrow')}</p>
      <h2 className="obw-display obw-display--lg obw-display--light">{t('landing.faq.title')}</h2>
      <div className="obw-rule obw-rule--center" aria-hidden="true" />
      <div className="obw-card obw-card--dark landing-box obw-faq-list">
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.locationQuestion')}</h3>
          <p>{t('landing.faq.locationAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.travelQuestion')}</h3>
          <p>{t('landing.faq.travelAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.lodgingQuestion')}</h3>
          <p>
            {t('landing.faq.lodgingAnswer', { name: WEDDING_LODGING.label })}{' '}
            <a className="obw-faq-list__link" href={WEDDING_LODGING.website} target="_blank" rel="noreferrer">
              {t('landing.faq.lodgingLink')}
            </a>
            .
          </p>
          <p>
            {t('landing.faq.hotelAnswerBefore')}
            <a className="obw-faq-list__link" href={WEDDING_LODGING_HOTEL.website} target="_blank" rel="noreferrer">
              {WEDDING_LODGING_HOTEL.label}
            </a>
            {t('landing.faq.hotelAnswerAfter')}
          </p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.foodQuestion')}</h3>
          <p>{t('landing.faq.foodAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.phoneQuestion')}</h3>
          <p>{t('landing.faq.phoneAnswer')}</p>
        </article>
        <article className="obw-faq-list__item">
          <h3>{t('landing.faq.servicesQuestion')}</h3>
          <p>{t('landing.faq.servicesAnswer')}</p>
        </article>
      </div>
    </section>
  );
}
