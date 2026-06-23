import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';

/** Landing RSVP call-to-action section. */
export function LandingRsvpSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-section--center obw-section--deep obw-fade-up" id="rsvp">
      <p className="obw-kicker">{t('landing.rsvp.eyebrow')}</p>
      <h2 className="obw-display obw-display--lg">{t('landing.rsvp.heading')}</h2>
      <p className="obw-body obw-body--center obw-body--narrow">{t('landing.rsvp.body')}</p>
      <div className="obw-rule obw-rule--center" aria-hidden="true" />
      <Link className="obw-btn obw-btn--primary" to="/rsvp">
        {t('landing.rsvp.button')}
      </Link>
    </section>
  );
}
