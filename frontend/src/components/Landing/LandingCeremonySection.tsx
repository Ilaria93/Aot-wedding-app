import { Flower2, Leaf } from 'lucide-react';

import {
  formatWeddingDateDisplay,
  formatWeddingTimeDisplay,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

/** Landing ceremony details card with date, time and venue. */
export function LandingCeremonySection() {
  const { t, locale } = useI18n();

  return (
    <section className="landing-ceremony" id="ceremony">
      <div className="landing-ceremony__card">
        <h2 className="landing-section-heading">{t('landing.ceremony.heading')}</h2>
        <p className="landing-ceremony__line">{formatWeddingDateDisplay(locale)}</p>
        <p className="landing-ceremony__line">{formatWeddingTimeDisplay(locale)}</p>
        <p className="landing-ceremony__line">{t('landing.ceremony.venue')}</p>
        <p className="landing-ceremony__line">{t('landing.ceremony.city')}</p>
        <p className="landing-ceremony__muted">{t('landing.ceremony.body')}</p>
      </div>
      <div className="landing-ceremony__artwork">
        <p>{t('landing.ceremony.artworkPlaceholder')}</p>
        <div className="landing-ceremony__flowers" aria-hidden>
          <Flower2 size={24} color="var(--aot-bronze)" />
          <Leaf size={22} color="var(--aot-military-green)" />
        </div>
      </div>
    </section>
  );
}
