import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

/** Login screen that restores the user session and role. */
export function LoginPage() {
  const navigate = useNavigate();
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
      navigate('/');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('login.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-centered">
      <form className="card" onSubmit={(event) => void handleLogin(event)}>
        <p className="eyebrow">{t('login.eyebrow')}</p>
        <h1 className="title">{t('login.title')}</h1>
        <p className="subtitle">{t('login.subtitle')}</p>

        <label className="field">
          <span className="sr-only">{t('common.fields.email')}</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder={t('common.fields.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="sr-only">{t('common.fields.password')}</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder={t('common.fields.password')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>{t('login.rememberMe')}</span>
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="button button-primary" disabled={submitting}>
          {submitting ? t('login.submitLoading') : t('login.submitLabel')}
        </button>

        <p className="link-row">
          <Link className="text-link" to="/auth/register">
            {t('login.registerLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
