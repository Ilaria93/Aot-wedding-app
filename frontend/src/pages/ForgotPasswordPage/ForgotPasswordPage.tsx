import { Link } from 'react-router-dom';
import { useState } from 'react';

import { requestPasswordReset } from '@/services/authApi';
import { getApiErrorMessage } from '@/services/apiErrors';
import { useI18n } from '@/contexts/I18nContext';
import '@/pages/LoginPage/styles/LoginPage.scss';

/** Lets the couple request a set/reset-password email from the login screen. */
export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('forgotPassword.genericError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-card__kicker">{t('auth.experience.login.seriesTitle')}</span>
        <p className="login-card__brand">{t('forgotPassword.title')}</p>
        <p className="login-card__sub">{t('forgotPassword.subtitle')}</p>

        {sent ? (
          <p className="login-card__sub">{t('forgotPassword.successMessage')}</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <label className="login-field" htmlFor="forgot-password-email">
              <span className="login-field__label">{t('common.fields.email')}</span>
              <input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {error ? <p className="login-error">{error}</p> : null}

            <button className="login-btn" type="submit" disabled={submitting}>
              {submitting ? t('forgotPassword.submitLoading') : t('forgotPassword.submitLabel')}
            </button>
          </form>
        )}

        <p className="login-card__sub" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <Link to="/auth/login">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
