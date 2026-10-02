import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { LoadingScreen } from '@/components/LoadingScreen';
import { RememberMeToggle } from '@/components/RememberMeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { LoginLocationState } from '@/pages/LoginPage/types/LoginPage.types';
import './styles/LoginPage.scss';

/** Admin-only login screen — one shared passcode unlocks the couple's account. */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as LoginLocationState | null)?.from ?? '/';
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await signIn({ secret, remember_me: rememberMe });
      navigate(redirectTarget, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('login.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  // Signing in can take a few seconds (the backend may be waking up): show the
  // crest instead of a frozen form. A wrong code brings the form back with the
  // error and the typed code still in place.
  if (submitting) {
    return <LoadingScreen label={t('login.submitLoading')} />;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-card__kicker">{t('auth.experience.login.seriesTitle')}</span>
        <p className="login-card__brand">{t('login.title')}</p>
        <p className="login-card__sub">{t('login.subtitle')}</p>

        <form onSubmit={(event) => void handleLogin(event)}>
          <label className="login-field" htmlFor="login-secret">
            <span className="login-field__label">{t('login.secretLabel')}</span>
            <span className="login-field__control">
              <input
                id="login-secret"
                type={showSecret ? 'text' : 'password'}
                autoComplete="off"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
              />
              <button
                type="button"
                className="login-field__toggle"
                aria-label={t(showSecret ? 'login.hideSecret' : 'login.showSecret')}
                aria-pressed={showSecret}
                onClick={() => setShowSecret((current) => !current)}
              >
                {showSecret ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </span>
          </label>

          <div className="login-remember">
            <RememberMeToggle checked={rememberMe} label={t('login.rememberMe')} onChange={setRememberMe} />
          </div>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="login-btn" type="submit" disabled={submitting}>
            {submitting ? t('login.submitLoading') : t('login.submitLabel')}
          </button>
        </form>
      </div>
    </div>
  );
}
