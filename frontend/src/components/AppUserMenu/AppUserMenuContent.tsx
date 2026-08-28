import { CalendarCheck, LogIn, LogOut, Settings, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

type AppUserMenuContentProps = {
  onNavigate: () => void;
};

/** RSVP, account and language actions — shared by the desktop dropdown and the mobile nav panel. */
export function AppUserMenuContent({ onNavigate }: AppUserMenuContentProps) {
  const { user, isAuthenticated, canManageWedding, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  async function handleSignOut() {
    onNavigate();
    await signOut();
    navigate('/');
  }

  return (
    <>
      <div className="app-user-menu__section">
        {isHome ? (
          <a
            href="#rsvp"
            role="menuitem"
            className="app-user-menu__action app-user-menu__action--rsvp"
            onClick={onNavigate}>
            <CalendarCheck size={15} aria-hidden />
            {t('navigation.stack.rsvp')}
          </a>
        ) : (
          <Link
            to={isAuthenticated ? '/rsvp' : '/auth/login'}
            role="menuitem"
            className="app-user-menu__action app-user-menu__action--rsvp"
            onClick={onNavigate}>
            <CalendarCheck size={15} aria-hidden />
            {t('navigation.stack.rsvp')}
          </Link>
        )}
      </div>

      <div className="app-user-menu__header">
        {isAuthenticated && user ? (
          <>
            <p className="app-user-menu__name">
              {user.first_name} {user.last_name}
            </p>
            <p className="app-user-menu__meta">{user.email}</p>
          </>
        ) : (
          <>
            <p className="app-user-menu__name">{t('navigation.userMenu.guestTitle')}</p>
            <p className="app-user-menu__meta">{t('navigation.userMenu.guestHint')}</p>
          </>
        )}
      </div>

      <div className="app-user-menu__section">
        <p className="app-user-menu__section-label">{t('navigation.userMenu.sectionAccount')}</p>
        <div className="app-user-menu__actions">
          {isAuthenticated ? (
            <>
              <Link to="/profile" role="menuitem" className="app-user-menu__action" onClick={onNavigate}>
                <Settings size={15} aria-hidden />
                {t('navigation.tabs.profile')}
              </Link>
              {canManageWedding ? (
                <Link to="/admin" role="menuitem" className="app-user-menu__action" onClick={onNavigate}>
                  <Shield size={15} aria-hidden />
                  {t('navigation.tabs.admin')}
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="app-user-menu__action app-user-menu__action--danger"
                onClick={() => void handleSignOut()}>
                <LogOut size={15} aria-hidden />
                {t('common.signOut')}
              </button>
            </>
          ) : (
            <Link to="/auth/login" role="menuitem" className="app-user-menu__action" onClick={onNavigate}>
              <LogIn size={15} aria-hidden />
              {t('navigation.stack.login')}
            </Link>
          )}
        </div>
      </div>

      <div className="app-user-menu__section">
        <p className="app-user-menu__section-label">{t('navigation.userMenu.sectionPreferences')}</p>
        <LanguageSwitcher embedded onLocaleChange={onNavigate} />
      </div>
    </>
  );
}
