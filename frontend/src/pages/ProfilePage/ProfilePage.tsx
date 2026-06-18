import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatUserRoleLabel } from '@/services/authApi';
import './styles/ProfilePage.scss';

/** Profile screen for account info, role and session actions. */
export function ProfilePage() {
  const { user, isBootstrapping, signOut } = useAuth();
  const { t } = useI18n();

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

        <button
          type="button"
          className="button button-secondary button-secondary--block"
          onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  );
}
