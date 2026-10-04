import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';

/** Short teaser for the theme page: title, one-line pitch, link to /tema. */
export function LandingThemeSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-section--center obw-fade-up" id="theme">
      <div className="obw-container obw-container--narrow obw-stack-center">
        <h2 className="obw-display obw-display--lg">{t('navigation.tabs.tema')}</h2>
        <span className="obw-rule obw-rule--center" aria-hidden="true" />
        <div className="obw-card obw-card--dark landing-box obw-stack-center">
          <p className="obw-body">{t('tema.subtitle')}</p>
          <dl className="landing-theme__terms">
            {(['Seal', 'Reports'] as const).map((id) => (
              <div key={id}>
                <dt>{t(`tema.symbol${id}Term`)}</dt>
                <dd>{t(`tema.symbol${id}Body`)}</dd>
              </div>
            ))}
          </dl>
          <Link to="/tema" className="obw-btn obw-btn--secondary">
            {t('landing.themeTeaser.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
