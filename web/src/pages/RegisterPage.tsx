import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { SelectableUserRole } from '@/services/authApi';

function getRoleOptions(t: ReturnType<typeof useI18n>['t']) {
  return [
    { value: 'bride' as const, label: t('common.roles.bride') },
    { value: 'groom' as const, label: t('common.roles.groom') },
    { value: 'invited' as const, label: t('common.roles.invited') },
  ];
}

/** Registration screen shared by bride, groom and guests. */
export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useI18n();
  const roleOptions = useMemo(() => getRoleOptions(t), [t]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelectableUserRole>('invited');
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
        role,
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
    <div className="page-centered">
      <form className="card" onSubmit={(event) => void handleRegister(event)}>
        <p className="eyebrow">{t('register.eyebrow')}</p>
        <h1 className="title">{t('register.title')}</h1>
        <p className="subtitle">{t('register.subtitle')}</p>

        <label className="field">
          <input
            className="input"
            placeholder={t('common.fields.firstName')}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label className="field">
          <input
            className="input"
            placeholder={t('common.fields.lastName')}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className="field">
          <input
            className="input"
            type="email"
            placeholder={t('common.fields.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <input
            className="input"
            type="password"
            placeholder={t('common.fields.password')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t('register.roleLabel')}</span>
          <select className="select" value={role} onChange={(event) => setRole(event.target.value as SelectableUserRole)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>{t('register.rememberMe')}</span>
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="button button-primary" disabled={submitting}>
          {submitting ? t('register.submitLoading') : t('register.submitLabel')}
        </button>

        <p className="link-row">
          <Link className="text-link" to="/auth/login">
            {t('register.loginLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
