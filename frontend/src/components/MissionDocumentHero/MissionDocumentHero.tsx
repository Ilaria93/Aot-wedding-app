import { HeroParticleField } from '@/components/MissionDocumentHero/HeroParticleField';
import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import {
  formatWeddingHeroDate,
  formatWeddingHeroVenue,
  WEDDING_COUPLE_NAMES,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

import './styles/MissionDocumentHero.scss';

/** Full-bleed cover hero — couple, date, venue and seal over the sunset artwork. */
export function MissionDocumentHero() {
  const { locale, t } = useI18n();

  return (
    <section
      className="obw-section obw-section--bare obw-fade-up"
      aria-labelledby="mission-hero-title">
      <div className="obw-container">
        <div className="mission-hero">
          <div className="mission-hero__band">
            <HeroParticleField />
            <div className="mission-hero__band-content">
              <h1 id="mission-hero-title" className="mission-hero__title">
                {WEDDING_COUPLE_NAMES}
              </h1>

              <p className="mission-hero__date">
                <span className="mission-hero__date-rule" aria-hidden />
                {formatWeddingHeroDate(locale)}
                <span className="mission-hero__date-rule" aria-hidden />
              </p>
              <p className="mission-hero__venue">{formatWeddingHeroVenue()}</p>

              <MissionDocumentSeal />

              <div className="mission-hero__scroll-cue" aria-hidden>
                <span className="mission-hero__scroll-label">{t('landing.mission.scrollCue')}</span>
                <span className="mission-hero__scroll-mouse">
                  <span className="mission-hero__scroll-wheel" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
