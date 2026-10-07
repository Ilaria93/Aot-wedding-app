import { MapPin } from 'lucide-react';

import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { formatWeddingDateDisplay, WEDDING_MAPS_URL } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

/** Landing ceremony section — date, time and venue in a card under the title. */
export function LandingCeremonySection() {
  const { t, locale } = useI18n();

  return (
    <section className="obw-section obw-fade-up" id="ceremony">
      <div className="obw-container obw-container--narrow obw-stack-center">
        <h2 className="obw-display obw-display--lg">{t('landing.ceremony.heading')}</h2>
        <div className="obw-rule obw-rule--center" aria-hidden="true" />
        <div className="obw-card obw-card--dark landing-box landing-ceremony__details obw-stack-center">
          <p className="landing-ceremony__date">{formatWeddingDateDisplay(locale)}</p>
          <dl className="landing-ceremony__times">
            <div className="landing-ceremony__time landing-ceremony__time--secondary">
              <dt>{t('landing.ceremony.arrivalLabel')}</dt>
              <dd>{t('landing.ceremony.arrivalTime')}</dd>
            </div>
            <div className="landing-ceremony__time">
              <dt>{t('landing.ceremony.startLabel')}</dt>
              <dd>{t('landing.ceremony.startTime')}</dd>
            </div>
          </dl>
          <div className="landing-ceremony__place">
            <p className="landing-ceremony__venue">{t('landing.ceremony.venueName')}</p>
            <p className="landing-ceremony__area">
              {t('landing.ceremony.venueArea')} · {t('landing.ceremony.city')}
            </p>
          </div>
          <p className="obw-body obw-body--flush">{t('landing.ceremony.body')}</p>
          <div className="landing-ceremony__actions">
            <a
              className="obw-btn obw-btn--secondary landing-ceremony__map-link"
              href={WEDDING_MAPS_URL}
              target="_blank"
              rel="noreferrer">
              <MapPin size={16} aria-hidden />
              {t('landing.ceremony.mapLink')}
            </a>
            <AddToCalendarButton />
          </div>
        </div>
      </div>
    </section>
  );
}
