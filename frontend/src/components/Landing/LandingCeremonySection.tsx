import {
  formatWeddingDateDisplay,
  formatWeddingTimeDisplay,
} from '@/constants/weddingEvent';
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
          <p className="obw-meta">{formatWeddingDateDisplay(locale)}</p>
          <p className="obw-meta">{formatWeddingTimeDisplay(locale)}</p>
          <p className="obw-meta">{t('landing.ceremony.venue')}</p>
          <p className="obw-meta">{t('landing.ceremony.city')}</p>
          <p className="obw-body obw-body--flush">{t('landing.ceremony.body')}</p>
        </div>
      </div>
    </section>
  );
}
