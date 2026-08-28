import { ChevronDown, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { AppUserMenuContent } from '@/components/AppUserMenu/AppUserMenuContent';
import { getUserInitials } from '@/components/AppUserMenu/getUserInitials';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AppUserMenu.scss';

/**
 * Desktop-only account dropdown — trigger + panel around AppUserMenuContent.
 * Hidden under 768px, where AppTopBar renders the same content inside the
 * mobile nav panel instead, so there's a single menu trigger on small screens.
 */
export function AppUserMenu() {
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
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
          <AppUserMenuContent onNavigate={closeMenu} />
        </div>
      ) : null}
    </div>
  );
}
