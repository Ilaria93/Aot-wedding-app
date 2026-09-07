import type { ReactNode } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import './styles/AuthExperience.scss';

type AuthPageShellProps = {
  children: ReactNode;
};

/** Split auth layout inspired by official AoT portal sites, adapted to OBW wedding tone.
 * Admin-only login now — the couple's accounts are seeded directly in the database. */
export function AuthPageShell({ children }: AuthPageShellProps) {
  const { t } = useI18n();

  return (
    <div className="auth-experience">
      <div className="auth-experience__ambient" aria-hidden="true" />

      <aside className="auth-experience__brand">
        <div className="obw-portal-scanlines" aria-hidden="true" />
        <div className="auth-experience__brand-texture" aria-hidden="true" />
        <div className="auth-experience__brand-glow" aria-hidden="true" />
        <div className="auth-experience__brand-slash" aria-hidden="true" />

        <div className="auth-experience__brand-body obw-portal-frame obw-fade-up">
          <div className="obw-portal-stamp">
            <span className="obw-portal-stamp__date">{t('auth.experience.stampDate')}</span>
            <span className="obw-portal-stamp__label">{t('auth.experience.login.stampLabel')}</span>
          </div>

          <p className="obw-portal-series">{t('auth.experience.login.seriesTitle')}</p>
          <p className="obw-kicker obw-kicker--light">{t('auth.experience.login.eyebrow')}</p>
          <h2 className="obw-display obw-display--light auth-experience__headline">
            {t('auth.experience.login.headline')}
          </h2>
          <p className="auth-experience__lead">{t('auth.experience.login.lead')}</p>
          <div className="obw-rule auth-experience__rule" aria-hidden="true" />

          <ul className="auth-experience__features">
            <li>{t('auth.experience.login.featureOne')}</li>
            <li>{t('auth.experience.login.featureTwo')}</li>
            <li>{t('auth.experience.login.featureThree')}</li>
          </ul>

          <p className="auth-experience__code">{t('auth.experience.login.missionCode')}</p>
        </div>
      </aside>

      <main className="auth-experience__main">
        <div className="auth-experience__form-panel obw-portal-frame obw-portal-frame--light obw-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
