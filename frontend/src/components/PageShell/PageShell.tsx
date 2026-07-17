import type { ReactNode } from 'react';

import { useI18n } from '@/contexts/I18nContext';

type PageShellProps = {
  children: ReactNode;
  loading?: boolean;
};

/** Shared layout wrapper for guest-facing app screens. */
export function PageShell({ children, loading = false }: PageShellProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="obw-page obw-page--app">
      <div className="obw-container obw-page__stack">{children}</div>
    </div>
  );
}
