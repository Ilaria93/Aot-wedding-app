import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

import { confirmPasswordReset } from '@/services/authApi';
import { getApiErrorMessage } from '@/services/apiErrors';
import { useI18n } from '@/contexts/I18nContext';
import '@/pages/LoginPage/styles/LoginPage.scss';

/** Lets the couple set a new password from the emailed reset link. */
export function ResetPasswordPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await confirmPasswordReset(token, newPassword);
      setDone(true);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('resetPassword.invalidTokenError')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-card__kicker">{t('auth.experience.login.seriesTitle')}</span>
        <p className="login-card__brand">{t('resetPassword.title')}</p>

        {!token ? (
          <p className="login-error">{t('resetPassword.invalidTokenError')}</p>
        ) : done ? (
          <p className="login-card__sub">{t('resetPassword.successMessage')}</p>
        ) : (
          <>
            <p className="login-card__sub">{t('resetPassword.subtitle')}</p>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label className="login-field" htmlFor="reset-password-new-password">
                <span className="login-field__label">{t('resetPassword.passwordLabel')}</span>
                <input
                  id="reset-password-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>

              {error ? <p className="login-error">{error}</p> : null}

              <button className="login-btn" type="submit" disabled={submitting}>
                {submitting ? t('resetPassword.submitLoading') : t('resetPassword.submitLabel')}
              </button>
            </form>
          </>
        )}

        <p className="login-card__sub" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <Link to="/auth/login">{t('resetPassword.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
