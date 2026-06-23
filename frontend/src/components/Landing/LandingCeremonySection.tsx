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
    <section className="obw-section obw-section--deep obw-fade-up" id="ceremony">
      <div className="obw-container obw-split obw-split--reverse">
        <div className="obw-card obw-card--interactive">
          <h2 className="obw-display obw-display--sm">{t('landing.ceremony.heading')}</h2>
          <div className="obw-rule" aria-hidden="true" />
          <p className="obw-meta">{formatWeddingDateDisplay(locale)}</p>
          <p className="obw-meta">{formatWeddingTimeDisplay(locale)}</p>
          <p className="obw-meta">{t('landing.ceremony.venue')}</p>
          <p className="obw-meta">{t('landing.ceremony.city')}</p>
          <p className="obw-body">{t('landing.ceremony.body')}</p>
        </div>
        <div className="obw-artwork">
          <p>{t('landing.ceremony.artworkPlaceholder')}</p>
          <div className="obw-artwork__accent" aria-hidden>
            <Flower2 size={22} />
            <Leaf size={20} />
          </div>
        </div>
      </div>
    </section>
  );
}
