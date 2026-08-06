import { Compass, Flag, Heart, Images, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { HeroParticleField } from '@/components/MissionDocumentHero/HeroParticleField';
import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import {
  formatWeddingHeroDate,
  formatWeddingHeroVenue,
  WEDDING_COUPLE_NAMES,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { useWeddingCountdown } from '@/hooks/useWeddingCountdown';
import type { TranslationKey } from '@/i18n/translations';

import './styles/MissionDocumentHero.scss';

type MissionCard = {
  readonly id: string;
  readonly titleKey: TranslationKey;
  readonly descKey: TranslationKey;
  readonly to: string;
  readonly icon: LucideIcon;
};

const MISSION_CARDS: readonly MissionCard[] = [
  {
    id: 'rsvp',
    titleKey: 'landing.mission.cards.rsvpTitle',
    descKey: 'landing.mission.cards.rsvpDesc',
    to: '/rsvp',
    icon: Flag,
  },
  {
    id: 'album',
    titleKey: 'landing.mission.cards.albumTitle',
    descKey: 'landing.mission.cards.albumDesc',
    to: '/album',
    icon: Images,
  },
  {
    id: 'travel',
    titleKey: 'landing.mission.cards.travelTitle',
    descKey: 'landing.mission.cards.travelDesc',
    to: '/travel',
    icon: Compass,
  },
  {
    id: 'story',
    titleKey: 'landing.mission.cards.storyTitle',
    descKey: 'landing.mission.cards.storyDesc',
    to: '#story',
    icon: Heart,
  },
] as const;

/**
 * Editorial mission-document home hero — cold open, seal, couple, countdown and mission cards.
 */
export function MissionDocumentHero() {
  const { locale, t } = useI18n();
  const countdown = useWeddingCountdown();

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

              <p className="mission-hero__vow">{t('landing.mission.subtitle')}</p>

              <div className="mission-hero__countdown" role="timer" aria-live="off">
                <div className="mission-hero__countdown-cell">
                  <b>{countdown.days}</b>
                  <span>{t('landing.cinematic.countdownUnitDays')}</span>
                </div>
                <div className="mission-hero__countdown-cell">
                  <b>{String(countdown.hours).padStart(2, '0')}</b>
                  <span>{t('landing.cinematic.countdownUnitHours')}</span>
                </div>
                <div className="mission-hero__countdown-cell">
                  <b>{String(countdown.minutes).padStart(2, '0')}</b>
                  <span>{t('landing.cinematic.countdownUnitMinutes')}</span>
                </div>
                <div className="mission-hero__countdown-cell">
                  <b>{String(countdown.seconds).padStart(2, '0')}</b>
                  <span>{t('landing.cinematic.countdownUnitSeconds')}</span>
                </div>
              </div>

              <div className="mission-hero__scroll-cue" aria-hidden>
                <span className="mission-hero__scroll-label">{t('landing.mission.scrollCue')}</span>
                <span className="mission-hero__scroll-mouse">
                  <span className="mission-hero__scroll-wheel" />
                </span>
              </div>
            </div>
          </div>

          <div className="mission-hero__divider" aria-hidden>
            <span className="mission-hero__divider-line" />
            <span className="mission-hero__divider-label">{t('landing.mission.ordersLabel')}</span>
            <span className="mission-hero__divider-line" />
          </div>

          <nav className="mission-hero__grid" aria-label={t('landing.mission.ordersLabel')}>
            {MISSION_CARDS.map((card) => {
              const Icon = card.icon;
              const content = (
                <>
                  <span className="mission-hero__card-icon" aria-hidden>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="mission-hero__card-title">{t(card.titleKey)}</span>
                  <span className="mission-hero__card-desc">{t(card.descKey)}</span>
                  <span className="mission-hero__card-arrow" aria-hidden>
                    →
                  </span>
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
