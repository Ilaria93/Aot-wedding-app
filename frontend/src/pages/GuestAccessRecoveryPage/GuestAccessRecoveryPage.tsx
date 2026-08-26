import { useState } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import { requestGuestMagicLink } from '@/services/guestAccessApi';
import './styles/GuestAccessRecoveryPage.scss';

/** "Hai perso il link?" — requests a fresh magic-link email by address. */
export function GuestAccessRecoveryPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestGuestMagicLink(email.trim());
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="obw-page guest-access-recovery-page">
      <div className="obw-container guest-access-recovery-page__inner">
        <h1 className="obw-display obw-display--sm">{t('guestAccess.recoveryTitle')}</h1>
        <p className="obw-body">{t('guestAccess.recoveryIntro')}</p>

        {sent ? (
          <p className="obw-body">{t('guestAccess.recoverySent')}</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <label className="obw-field" htmlFor="recovery-email">
              <span className="obw-field-label">{t('common.fields.email')}</span>
              <input
                id="recovery-email"
                className="obw-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="obw-btn obw-btn--primary obw-btn--block"
              disabled={submitting || !email.trim()}>
              {t('guestAccess.recoverySubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
