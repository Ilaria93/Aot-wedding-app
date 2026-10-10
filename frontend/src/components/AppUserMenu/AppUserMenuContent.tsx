import { LogIn, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

type AppUserMenuContentProps = {
  onNavigate: () => void;
};

/**
 * The same menu for every visitor: the couple's login (or, once signed in as
 * the couple, sign-out) and the language switcher. Guests who confirmed from
 * their invite link keep a hidden session but get no account section — they
 * have no profile or RSVP screen to go back to. Shared by the desktop dropdown
 * and the mobile nav panel.
 */
export function AppUserMenuContent({ onNavigate }: AppUserMenuContentProps) {
  const { canManageWedding, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  async function handleSignOut() {
    onNavigate();
    await signOut();
    navigate('/');
  }

  return (
    <>
      <div className="app-user-menu__section">
        <p className="app-user-menu__section-label">{t('navigation.userMenu.sectionAccount')}</p>
        <div className="app-user-menu__actions">
          {canManageWedding ? (
            <button
              type="button"
              role="menuitem"
              className="app-user-menu__action app-user-menu__action--danger"
              onClick={() => void handleSignOut()}>
              <LogOut size={15} aria-hidden />
              {t('common.signOut')}
            </button>
          ) : (
            <Link to="/auth/login" role="menuitem" className="app-user-menu__action" onClick={onNavigate}>
              <LogIn size={15} aria-hidden />
              {t('navigation.userMenu.coupleLogin')}
            </Link>
          )}
        </div>
      </div>

      {!canManageWedding ? (
        <div className="app-user-menu__section">
          <p className="app-user-menu__section-label">{t('navigation.userMenu.sectionPreferences')}</p>
          <LanguageSwitcher embedded onLocaleChange={onNavigate} />
        </div>
      ) : null}
    </>
  );
}
