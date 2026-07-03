import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { AuthPageShell } from '@/components/AuthExperience';
import { RememberMeToggle } from '@/components/RememberMeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { LoginLocationState } from '@/pages/LoginPage/types/LoginPage.types';

/** Registration screen for guests; optional admin code for spouse accounts. */
export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = (location.state as LoginLocationState | null)?.from ?? '/';
  const { signUp } = useAuth();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSecret, setRoleSecret] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await signUp({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        ...(roleSecret.trim() ? { role_secret: roleSecret.trim() } : {}),
        remember_me: rememberMe,
      });
      navigate(redirectTarget, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('register.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell variant="register">
      <form className="auth-form" onSubmit={(event) => void handleRegister(event)}>
        <header className="auth-form__header">
          <h2 className="obw-display obw-display--sm">{t('register.title')}</h2>
          <p className="obw-body">{t('register.subtitle')}</p>
        </header>

        <div className="auth-form__fields auth-form__fields--split">
          <label className="obw-field auth-form__field--stagger" htmlFor="register-first-name">
            <span className="obw-field-label">{t('common.fields.firstName')}</span>
            <input
              id="register-first-name"
              className="obw-input"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>

          <label className="obw-field auth-form__field--stagger" htmlFor="register-last-name">
            <span className="obw-field-label">{t('common.fields.lastName')}</span>
            <input
              id="register-last-name"
              className="obw-input"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>

          <label className="obw-field auth-form__field--stagger auth-form__field--full" htmlFor="register-email">
            <span className="obw-field-label">{t('common.fields.email')}</span>
            <input
              id="register-email"
              className="obw-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="obw-field auth-form__field--stagger auth-form__field--full" htmlFor="register-password">
            <span className="obw-field-label">{t('common.fields.password')}</span>
            <input
              id="register-password"
              className="obw-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="obw-field auth-form__field--stagger auth-form__field--full" htmlFor="register-role-secret">
            <span className="obw-field-label">{t('register.roleSecretLabel')}</span>
            <input
              id="register-role-secret"
              className="obw-input"
              type="password"
              autoComplete="off"
              value={roleSecret}
              onChange={(event) => setRoleSecret(event.target.value)}
            />
          </label>
        </div>

        <p className="auth-form__hint">{t('register.roleSecretHint')}</p>

        <div className="auth-form__remember">
          <RememberMeToggle
            checked={rememberMe}
            label={t('register.rememberMe')}
            onChange={setRememberMe}
          />
        </div>

        {error ? <p className="auth-form__error">{error}</p> : null}

        <button
          type="submit"
          className="obw-btn obw-btn--primary obw-btn--block auth-form__submit"
          disabled={submitting}>
          {submitting ? t('register.submitLoading') : t('register.submitLabel')}
        </button>

        <p className="auth-form__footer">
          <Link className="auth-form__footer-link" to="/auth/login" state={{ from: redirectTarget }}>
            {t('register.loginLink')}
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
