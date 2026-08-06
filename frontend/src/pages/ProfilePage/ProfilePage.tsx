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
    <div className="obw-page obw-page--app profile-page">
      <div className="obw-container obw-page__stack">
        <header className="obw-page-hero profile-page__hero">
          <p className="obw-kicker obw-kicker--light">{t('profile.eyebrow')}</p>
          <h1 className="obw-display obw-display--light">
            {user.first_name} {user.last_name}
          </h1>
          <p className="obw-body obw-body--flush">{t('profile.subtitle')}</p>
        </header>

        <div className="obw-card profile-page__card obw-summary">
          <div className="obw-summary__row">
            <p className="obw-summary__label">{t('profile.emailLabel')}</p>
            <p className="obw-summary__value">{user.email}</p>
          </div>
          <div className="obw-summary__row">
            <p className="obw-summary__label">{t('profile.roleLabel')}</p>
            <p className="obw-summary__value">{formatUserRoleLabel(user.role, t)}</p>
          </div>
        </div>

        <button
          type="button"
          className="obw-btn obw-btn--secondary obw-btn--block"
          onClick={() => void signOut()}>
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  );
}
