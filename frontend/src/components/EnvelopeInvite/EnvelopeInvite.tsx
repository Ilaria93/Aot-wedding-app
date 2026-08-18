import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  formatWeddingHeroDate,
  formatWeddingHeroVenue,
  WEDDING_COUPLE_NAMES,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

import './styles/EnvelopeInvite.scss';

type EnvelopeInviteProps = {
  firstName: string;
  lastName: string;
};

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
        <article className="envelope-invite__letter" aria-hidden={!isOpen}>
          <h1
            ref={letterHeadingRef}
            tabIndex={-1}
            className="obw-display obw-display--sm envelope-invite__greeting">
            {t('invite.greeting', { firstName })}
          </h1>
          <p className="obw-body envelope-invite__body-text">{t('invite.body')}</p>
          <p className="envelope-invite__details">
            <span>{WEDDING_COUPLE_NAMES}</span>
            <span className="envelope-invite__details-rule" aria-hidden />
            <span>{formatWeddingHeroDate(locale)}</span>
            <span className="envelope-invite__details-rule" aria-hidden />
            <span>{formatWeddingHeroVenue()}</span>
          </p>
          <Link
            className="obw-btn obw-btn--primary envelope-invite__cta"
            to="/auth/register"
            state={{ from: '/rsvp', prefill: { firstName, lastName } }}
            tabIndex={isOpen ? 0 : -1}>
            {t('invite.cta')}
          </Link>
        </article>

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
              className="envelope-invite__seal-crest"
              src="/assets/wedding/stemma.webp"
              alt=""
              width={96}
              height={113}
              loading="eager"
              decoding="async"
            />
          </button>
        </div>
      </div>

      {!isOpen ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}
    </div>
  );
}
