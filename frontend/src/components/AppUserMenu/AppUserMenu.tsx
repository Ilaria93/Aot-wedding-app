import { CalendarCheck, ChevronDown, LogIn, LogOut, Settings, Shield, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getUserInitials } from '@/components/AppUserMenu/getUserInitials';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AppUserMenu.scss';

/** Account dropdown — profile, admin, language and session actions. */
export function AppUserMenu() {
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { user, isAuthenticated, canManageWedding, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut();
    navigate('/');
  }

  function closeMenu() {
    setIsOpen(false);
  }

  const initials =
    isAuthenticated && user ? getUserInitials(user.first_name, user.last_name) : null;

  return (
    <div className="app-user-menu">
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        className={`app-user-menu__trigger${isOpen ? ' is-open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={`${menuId}-panel`}
        aria-label={t('navigation.userMenu.openLabel')}
        onClick={() => setIsOpen((current) => !current)}>
        <span className="app-user-menu__avatar" aria-hidden>
          {initials ?? <User size={16} strokeWidth={1.75} />}
        </span>
        <ChevronDown
          size={14}
          className={`app-user-menu__chevron${isOpen ? ' is-open' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          id={`${menuId}-panel`}
          className="app-user-menu__panel obw-fade-up"
          role="menu"
          aria-labelledby={`${menuId}-trigger`}>
          <div className="app-user-menu__section">
            {isHome ? (
              <a
                href="#rsvp"
                role="menuitem"
                className="app-user-menu__action app-user-menu__action--rsvp"
                onClick={closeMenu}>
                <CalendarCheck size={15} aria-hidden />
                {t('navigation.stack.rsvp')}
              </a>
            ) : (
              <Link
                to={isAuthenticated ? '/rsvp' : '/auth/login'}
                role="menuitem"
                className="app-user-menu__action app-user-menu__action--rsvp"
                onClick={closeMenu}>
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
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="app-user-menu__action"
                    onClick={closeMenu}>
                    <Settings size={15} aria-hidden />
                    {t('navigation.tabs.profile')}
                  </Link>
                  {canManageWedding ? (
                    <Link
                      to="/admin"
                      role="menuitem"
                      className="app-user-menu__action"
                      onClick={closeMenu}>
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
                <>
                  <Link
                    to="/auth/login"
                    role="menuitem"
                    className="app-user-menu__action"
                    onClick={closeMenu}>
                    <LogIn size={15} aria-hidden />
                    {t('navigation.stack.login')}
                  </Link>
                  <Link
                    to="/auth/register"
                    role="menuitem"
                    className="app-user-menu__action"
                    onClick={closeMenu}>
                    <User size={15} aria-hidden />
                    {t('navigation.stack.register')}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="app-user-menu__section">
            <p className="app-user-menu__section-label">{t('navigation.userMenu.sectionPreferences')}</p>
            <LanguageSwitcher embedded onLocaleChange={closeMenu} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
