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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // The backend answers 200 whether or not the address matches a guest, so
      // reaching here is the only honest signal. Telling the guest to check
      // their inbox after a failed request would just strand them.
      await requestGuestMagicLink(email.trim());
      setSent(true);
    } catch {
      setError(t('rsvp.submitError'));
    } finally {
      setSubmitting(false);
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
            {error ? <p className="auth-form__error">{error}</p> : null}
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
