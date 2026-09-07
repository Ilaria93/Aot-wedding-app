import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { RememberMeToggle } from '@/components/RememberMeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { LoginLocationState } from '@/pages/LoginPage/types/LoginPage.types';
import './styles/LoginPage.scss';

/** Admin-only login screen — the couple's account, seeded server-side. */
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
    <div className="login-page">
      <div className="login-card">
        <span className="login-card__kicker">{t('auth.experience.login.seriesTitle')}</span>
        <p className="login-card__brand">{t('login.title')}</p>
        <p className="login-card__sub">{t('login.subtitle')}</p>

        <form onSubmit={(event) => void handleLogin(event)}>
          <label className="login-field" htmlFor="login-email">
            <span className="login-field__label">{t('common.fields.email')}</span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="login-field" htmlFor="login-password">
            <span className="login-field__label">{t('common.fields.password')}</span>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="login-remember">
            <RememberMeToggle checked={rememberMe} label={t('login.rememberMe')} onChange={setRememberMe} />
          </div>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-btn" type="submit" disabled={submitting}>
            {submitting ? t('login.submitLoading') : t('login.submitLabel')}
          </button>
        </form>

        <p className="login-card__sub" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <Link to="/auth/forgot-password">{t('login.forgotPasswordLink')}</Link>
        </p>
      </div>
    </div>
  );
}
