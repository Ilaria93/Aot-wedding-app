import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatUserRoleLabel } from '@/services/authApi';

/** Profile screen for account info, role and session actions. */
export function ProfilePage() {
  const { user, isAuthenticated, isBootstrapping, signOut, saveProfile } = useAuth();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
  }, [user]);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setMessage(null);
      await saveProfile({ first_name: firstName.trim(), last_name: lastName.trim() });
      setMessage(t('profile.updatedMessage'));
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : t('profile.updateError'));
    } finally {
      setSaving(false);
    }
  }

  if (isBootstrapping) {
    return <div className="loading-screen">{t('common.loadingSession')}</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="page-centered">
        <div className="card">
          <p className="eyebrow">{t('profile.eyebrow')}</p>
          <h1 className="title">{t('profile.guestTitle')}</h1>
          <p className="subtitle">{t('profile.guestSubtitle')}</p>
          <LanguageSwitcher />
          <p className="link-row">
            <Link className="text-link" to="/auth/login">
              {t('profile.loginLink')}
            </Link>
            <Link className="text-link" to="/auth/register">
              {t('profile.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-centered">
      <div className="card">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1 className="title">
          {user.first_name} {user.last_name}
        </h1>
        <p className="subtitle">{t('profile.subtitle')}</p>

        <div className="gift-coordinates" style={{ marginBottom: 20 }}>
          <p>
            <span className="eyebrow">{t('profile.emailLabel')}</span>
            <br />
            {user.email}
          </p>
          <p>
            <span className="eyebrow">{t('profile.roleLabel')}</span>
            <br />
            {formatUserRoleLabel(user.role, t)}
          </p>
        </div>

        <LanguageSwitcher />

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

        {message ? <p className="helper-text">{message}</p> : null}

        <button
          type="button"
          className="button button-primary"
          disabled={saving}
          onClick={() => void handleSaveProfile()}>
          {saving ? t('profile.updateLoading') : t('profile.updateButton')}
        </button>

        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: 12, width: '100%' }}
          onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  );
}
