import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { AuthPageShell } from '@/components/AuthExperience';
import { RememberMeToggle } from '@/components/RememberMeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { LoginLocationState } from '@/pages/LoginPage/types/LoginPage.types';

/** Login screen that restores the user session and role. */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as LoginLocationState | null)?.from ?? '/';
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await signIn({ email: email.trim(), password, remember_me: rememberMe });
      navigate(redirectTarget, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('login.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell variant="login">
      <form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
        <header className="auth-form__header">
          <h2 className="obw-display obw-display--sm">{t('login.title')}</h2>
          <p className="obw-body">{t('login.subtitle')}</p>
        </header>

        <div className="auth-form__fields">
          <label className="obw-field auth-form__field--stagger" htmlFor="login-email">
            <span className="obw-field-label">{t('common.fields.email')}</span>
            <input
              id="login-email"
              className="obw-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="obw-field auth-form__field--stagger" htmlFor="login-password">
            <span className="obw-field-label">{t('common.fields.password')}</span>
            <input
              id="login-password"
              className="obw-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        <div className="auth-form__remember">
          <RememberMeToggle
            checked={rememberMe}
            label={t('login.rememberMe')}
            onChange={setRememberMe}
          />
        </div>

        {error ? <p className="auth-form__error">{error}</p> : null}

        <button
          type="submit"
          className="obw-btn obw-btn--primary obw-btn--block auth-form__submit"
          disabled={submitting}>
          {submitting ? t('login.submitLoading') : t('login.submitLabel')}
        </button>

        {/* Only inbound link to the magic-link recovery page: a guest who lost
            their WhatsApp invite has no password to log in with, and no other
            way to find /accedi/recupera. */}
        <p className="auth-form__footer">
          <Link className="auth-form__footer-link" to="/accedi/recupera">
            {t('login.guestRecoveryLink')}
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
