import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';

/** Landing RSVP call-to-action section. */
export function LandingRsvpSection() {
  const { t } = useI18n();

  return (
    <section className="landing-rsvp" id="rsvp">
      <h2 className="landing-rsvp__heading">{t('landing.rsvp.heading')}</h2>
      <p className="landing-rsvp__body">{t('landing.rsvp.body')}</p>
      <Link className="landing-rsvp__button" to="/rsvp">
        {t('landing.rsvp.button')}
      </Link>
    </section>
  );
}
