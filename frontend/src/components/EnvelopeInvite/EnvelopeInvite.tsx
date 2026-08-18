import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  WEDDING_CITY,
  WEDDING_VENUE_AREA,
  WEDDING_VENUE_NAME,
  formatWeddingDateDisplay,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

import './styles/EnvelopeInvite.scss';

type EnvelopeInviteProps = {
  firstName: string;
  lastName: string;
};

const CONTACT_EMAIL = 'davide.ilaria@esempio.it';

const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${WEDDING_VENUE_AREA} ${WEDDING_VENUE_NAME} ${WEDDING_CITY}`,
)}`;

/**
 * Personalized envelope for the WhatsApp invite link. Closed by default —
 * tapping the wax seal breaks it, the flap folds open, then the letter
 * fades in with the guest's name. Every step is a CSS transition triggered
 * by toggling one class; no animation library, no JS timers.
 */
export function EnvelopeInvite({ firstName, lastName }: EnvelopeInviteProps) {
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className={`envelope-invite${isOpen ? ' envelope-invite--open' : ''}`}>
      <div className="envelope-invite__stage">
        <div className="envelope-invite__body-shell" aria-hidden={isOpen}>
          <div className="envelope-invite__front" />
          <div className="envelope-invite__flap" />
          <button
            type="button"
            className="envelope-invite__seal"
            onClick={() => setIsOpen(true)}
            disabled={isOpen}
            aria-label={t('invite.openAria')}>
            <img
              className="envelope-invite__seal-wax"
              src="/assets/wedding/cera-oro.webp"
              alt=""
              width={1601}
              height={1496}
              loading="eager"
              decoding="async"
            />
          </button>
        </div>
      </div>

      {!isOpen ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}

      {/* Sibling of the (perspective:) stage, not a child — position: fixed
          needs to cover the real viewport, not the stage's containing block. */}
      <article className="envelope-invite__letter" aria-hidden={!isOpen}>
        <div className="envelope-invite__letter-content">
          <p className="envelope-invite__personal-greeting">{t('invite.greeting', { firstName })}</p>
          <h1
            ref={letterHeadingRef}
            tabIndex={-1}
            className="obw-display obw-display--sm envelope-invite__greeting">
            {t('invite.headline')}
          </h1>
          <p className="envelope-invite__couple-names">{t('invite.coupleNames')}</p>
          <p className="envelope-invite__details">
            {formatWeddingDateDisplay(locale)}
            <br />
            {WEDDING_VENUE_AREA}
            <br />
            {WEDDING_VENUE_NAME}, {WEDDING_CITY}
          </p>
          <p className="envelope-invite__ceremony-start">{t('invite.ceremonyStart')}</p>
          <p className="obw-body envelope-invite__body-text">{t('invite.intro')}</p>
        </div>

        <div className="envelope-invite__sections">
          <section className="envelope-invite__section">
            <h2 className="envelope-invite__section-title">{t('invite.directions.title')}</h2>
            <div className="envelope-invite__map-placeholder" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.5} />
              <span>{t('invite.directions.mapLabel')}</span>
            </div>
            <p className="envelope-invite__address">
              {WEDDING_VENUE_AREA} — {WEDDING_VENUE_NAME}, {WEDDING_CITY}.{' '}
              {t('invite.directions.parkingNote')}
            </p>
            <a
              className="obw-btn obw-btn--secondary envelope-invite__maps-link"
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noreferrer">
              {t('invite.directions.openMaps')}
            </a>
          </section>

          <section className="envelope-invite__section">
            <h2 className="envelope-invite__section-title">{t('invite.rsvpSection.title')}</h2>
            <p className="envelope-invite__rsvp-note">{t('invite.rsvpSection.note')}</p>
            <div className="envelope-invite__rsvp-actions">
              <Link
                className="obw-btn obw-btn--primary envelope-invite__cta"
                to="/auth/register"
                state={{ from: '/rsvp', prefill: { firstName, lastName } }}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.yes')}
              </Link>
              <a
                className="obw-btn obw-btn--secondary envelope-invite__contact"
                href={`mailto:${CONTACT_EMAIL}`}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.contact')}
              </a>
            </div>
          </section>

          <section className="envelope-invite__section envelope-invite__section--more-info">
            <p className="envelope-invite__more-info-text">{t('invite.moreInfo.text')}</p>
            <Link
              className="obw-btn obw-btn--secondary envelope-invite__more-info-link"
              to="/"
              tabIndex={isOpen ? 0 : -1}>
              {t('invite.moreInfo.cta')}
            </Link>
          </section>
        </div>
      </article>
    </div>
  );
}
