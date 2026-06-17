import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatUserRoleLabel } from '@/services/authApi';
import './styles/ProfilePage.scss';

/** Profile screen for account info, role and session actions. */
export function ProfilePage() {
  const { user, isBootstrapping, signOut, saveProfile } = useAuth();
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
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loadingSession')}</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="auth-screen">
      <div className="card aot-card--wide">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1 className="title">
          {user.first_name} {user.last_name}
        </h1>
        <p className="subtitle">{t('profile.subtitle')}</p>

        <div className="summary-card">
          <p className="summary-label">{t('profile.emailLabel')}</p>
          <p className="summary-value">{user.email}</p>
          <p className="summary-label">{t('profile.roleLabel')}</p>
          <p className="summary-value">{formatUserRoleLabel(user.role, t)}</p>
        </div>

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
          className="button button-secondary button-secondary--block"
          style={{ marginTop: 12 }}
          onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  );
}
