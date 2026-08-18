import { useState } from 'react';
import { Link } from 'react-router-dom';

import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import { WEDDING_COUPLE_NAMES, formatWeddingHeroDate, formatWeddingHeroVenue } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import './styles/InvitationPage.scss';

/** Digital envelope: tap the wax seal to open it and reveal the invitation card. */
export function InvitationPage() {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="invitation">
      <div className={`invitation__envelope${isOpen ? ' invitation__envelope--open' : ''}`}>
        <div className="invitation__body" aria-hidden="true" />

        <div className="invitation__card">
          <MissionDocumentSeal />
          <h1 className="invitation__card-title obw-display">{WEDDING_COUPLE_NAMES}</h1>
          <p className="invitation__card-date">{formatWeddingHeroDate(locale)}</p>
          <p className="invitation__card-venue">{formatWeddingHeroVenue()}</p>
          <Link className="obw-btn obw-btn--primary" to="/">
            {t('invitation.cta')}
          </Link>
        </div>

        <div className="invitation__flap" aria-hidden="true" />

        {!isOpen ? (
          <button
            type="button"
            className="invitation__seal"
            onClick={() => setIsOpen(true)}
            aria-label={t('invitation.openLabel')}>
            {t('invitation.sealInitials')}
          </button>
        ) : null}
      </div>

      {!isOpen ? <p className="invitation__hint">{t('invitation.hint')}</p> : null}
    </div>
  );
}
