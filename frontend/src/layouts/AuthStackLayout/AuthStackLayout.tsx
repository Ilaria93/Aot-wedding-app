import { Outlet, useLocation } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AuthStackLayout.scss';

const STACK_TITLE_KEYS = {
  '/auth/login': 'login',
  '/auth/register': 'register',
  '/rsvp': 'rsvp',
} as const;

/** Stack header for auth and RSVP routes. */
export function AuthStackLayout() {
  const location = useLocation();
  const { t } = useI18n();
  const titleKey =
    location.pathname.startsWith('/rsvp/')
      ? STACK_TITLE_KEYS['/rsvp']
      : (STACK_TITLE_KEYS[location.pathname as keyof typeof STACK_TITLE_KEYS] ?? 'login');

  return (
    <>
      <header className="stack-header">
        <div className="stack-header__start">
          <ScreenBackButton fallback="/" />
          <h1 className="stack-header__title">{t(`navigation.stack.${titleKey}`)}</h1>
        </div>
        <LanguageSwitcher compact />
      </header>
      <Outlet />
    </>
  );
}
