import { Link } from 'react-router-dom';

import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import { formatWeddingHeroDateLine, WEDDING_COUPLE_NAMES } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';

import './styles/MissionDocumentHero.scss';

type MissionCard = {
  readonly id: string;
  readonly titleKey: TranslationKey;
  readonly descKey: TranslationKey;
  readonly to: string;
  readonly icon: string;
};

const MISSION_CARDS: readonly MissionCard[] = [
  {
    id: 'rsvp',
    titleKey: 'landing.mission.cards.rsvpTitle',
    descKey: 'landing.mission.cards.rsvpDesc',
    to: '/rsvp',
    icon: '⚑',
  },
  {
    id: 'album',
    titleKey: 'landing.mission.cards.albumTitle',
    descKey: 'landing.mission.cards.albumDesc',
    to: '/album',
    icon: '◈',
  },
  {
    id: 'travel',
    titleKey: 'landing.mission.cards.travelTitle',
    descKey: 'landing.mission.cards.travelDesc',
    to: '/travel',
    icon: '⌖',
  },
  {
    id: 'story',
    titleKey: 'landing.mission.cards.storyTitle',
    descKey: 'landing.mission.cards.storyDesc',
    to: '#story',
    icon: '♥',
  },
] as const;

/**
 * Editorial mission-document home hero — seal, couple, date and mission order cards.
 */
export function MissionDocumentHero() {
  const { locale, t } = useI18n();

  return (
    <section className="obw-section obw-fade-up" aria-labelledby="mission-hero-title">
      <div className="obw-container">
        <div className="mission-hero">
          <div className="mission-hero__band">
            <MissionDocumentSeal />
            <h1 id="mission-hero-title" className="mission-hero__title">
              {WEDDING_COUPLE_NAMES}
            </h1>
            <p className="mission-hero__subtitle">{t('landing.mission.subtitle')}</p>
            <p className="mission-hero__date">{formatWeddingHeroDateLine(locale)}</p>
          </div>

          <div className="mission-hero__divider" aria-hidden>
            <span className="mission-hero__divider-line" />
            <span className="mission-hero__divider-label">{t('landing.mission.ordersLabel')}</span>
            <span className="mission-hero__divider-line" />
          </div>

          <nav className="mission-hero__grid" aria-label={t('landing.mission.ordersLabel')}>
            {MISSION_CARDS.map((card) => {
              const content = (
                <>
                  <span className="mission-hero__card-icon" aria-hidden>
                    {card.icon}
                  </span>
                  <span className="mission-hero__card-title">{t(card.titleKey)}</span>
                  <span className="mission-hero__card-desc">{t(card.descKey)}</span>
                </>
              );

              if (card.to.startsWith('#')) {
                return (
                  <a key={card.id} href={card.to} className="mission-hero__card">
                    {content}
                  </a>
                );
              }

              return (
                <Link key={card.id} to={card.to} className="mission-hero__card">
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
