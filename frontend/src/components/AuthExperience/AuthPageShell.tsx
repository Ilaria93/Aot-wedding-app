import type { ReactNode } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import './styles/AuthExperience.scss';

type AuthPageShellProps = {
  variant: 'login' | 'register';
  children: ReactNode;
};

const AUTH_EXPERIENCE_KEYS = {
  login: {
    seriesTitle: 'auth.experience.login.seriesTitle',
    stampLabel: 'auth.experience.login.stampLabel',
    eyebrow: 'auth.experience.login.eyebrow',
    headline: 'auth.experience.login.headline',
    lead: 'auth.experience.login.lead',
    featureOne: 'auth.experience.login.featureOne',
    featureTwo: 'auth.experience.login.featureTwo',
    featureThree: 'auth.experience.login.featureThree',
    missionCode: 'auth.experience.login.missionCode',
  },
  register: {
    seriesTitle: 'auth.experience.register.seriesTitle',
    stampLabel: 'auth.experience.register.stampLabel',
    eyebrow: 'auth.experience.register.eyebrow',
    headline: 'auth.experience.register.headline',
    lead: 'auth.experience.register.lead',
    featureOne: 'auth.experience.register.featureOne',
    featureTwo: 'auth.experience.register.featureTwo',
    featureThree: 'auth.experience.register.featureThree',
    missionCode: 'auth.experience.register.missionCode',
  },
} as const satisfies Record<'login' | 'register', Record<string, TranslationKey>>;

/** Split auth layout inspired by official AoT portal sites, adapted to OBW wedding tone. */
export function AuthPageShell({ variant, children }: AuthPageShellProps) {
  const { t } = useI18n();
  const keys = AUTH_EXPERIENCE_KEYS[variant];

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
            <span className="obw-portal-stamp__label">{t(keys.stampLabel)}</span>
          </div>

          <p className="obw-portal-series">{t(keys.seriesTitle)}</p>
          <p className="obw-kicker obw-kicker--light">{t(keys.eyebrow)}</p>
          <h2 className="obw-display obw-display--light auth-experience__headline">
            {t(keys.headline)}
          </h2>
          <p className="auth-experience__lead">{t(keys.lead)}</p>
          <div className="obw-rule auth-experience__rule" aria-hidden="true" />

          <ul className="auth-experience__features">
            <li>{t(keys.featureOne)}</li>
            <li>{t(keys.featureTwo)}</li>
            <li>{t(keys.featureThree)}</li>
          </ul>

          <p className="auth-experience__code">{t(keys.missionCode)}</p>
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
