import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { RememberMeToggle } from '@/components/RememberMeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/RegisterPage.scss';

/** Registration screen for guests; optional admin code for spouse accounts. */
export function RegisterPage() {
  const navigate = useNavigate();
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
      navigate('/');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('register.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="card" onSubmit={(event) => void handleRegister(event)}>
        <p className="eyebrow">{t('register.eyebrow')}</p>
        <h1 className="title">{t('register.title')}</h1>
        <p className="subtitle">{t('register.subtitle')}</p>

        <input
          className="input"
          placeholder={t('common.fields.firstName')}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <input
          className="input"
          placeholder={t('common.fields.lastName')}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
        <input
          className="input"
          type="email"
          placeholder={t('common.fields.email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder={t('common.fields.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder={t('register.roleSecretLabel')}
          value={roleSecret}
          onChange={(event) => setRoleSecret(event.target.value)}
        />
        <p className="helper-text">{t('register.roleSecretHint')}</p>

        <RememberMeToggle
          checked={rememberMe}
          label={t('register.rememberMe')}
          onChange={setRememberMe}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="button button-primary" disabled={submitting}>
          {submitting ? t('register.submitLoading') : t('register.submitLabel')}
        </button>

        <Link className="text-link" to="/auth/login">
          {t('register.loginLink')}
        </Link>
      </form>
    </div>
  );
}
