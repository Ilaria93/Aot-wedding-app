import { Link } from 'react-router-dom';
import { ClipboardList, Users } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import './styles/LandingRsvpSection.scss';

const RSVP_STEP_KEYS = ['stepOne', 'stepTwo', 'stepThree'] as const;

/** Landing RSVP briefing section with mission steps and CTA. */
export function LandingRsvpSection() {
  const { t } = useI18n();

  return (
    <section className="obw-section landing-rsvp obw-fade-up" id="rsvp">
      <div className="obw-container obw-split obw-split--reverse">
        <div className="obw-card obw-card--dark obw-card--interactive landing-rsvp__briefing">
          <div className="obw-card__texture" aria-hidden="true" />
          <div className="landing-rsvp__briefing-body">
            <p className="obw-kicker obw-kicker--light">{t('landing.rsvp.eyebrow')}</p>
            <h2 className="obw-display obw-display--sm obw-display--light">
              {t('landing.rsvp.heading')}
            </h2>
            <p className="obw-body landing-rsvp__lead">{t('landing.rsvp.body')}</p>

            <ol className="landing-rsvp__steps">
              {RSVP_STEP_KEYS.map((stepKey, index) => (
                <li key={stepKey} className="landing-rsvp__step">
                  <span className="landing-rsvp__step-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="landing-rsvp__step-copy">
                    <p className="obw-kicker obw-kicker--light">
                      {t(`landing.rsvp.${stepKey}Label` as TranslationKey)}
                    </p>
                    <p className="obw-body landing-rsvp__step-desc">
                      {t(`landing.rsvp.${stepKey}Desc` as TranslationKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="obw-kicker obw-kicker--light landing-rsvp__deadline">
              {t('landing.rsvp.deadlineNote')}
            </p>

            <Link className="obw-btn landing-rsvp__cta" to="/rsvp">
              {t('landing.rsvp.button')}
            </Link>
          </div>
        </div>

        <div className="landing-rsvp__visual" aria-hidden="true">
          <div className="landing-rsvp__visual-frame">
            <p className="obw-kicker landing-rsvp__visual-tag">{t('landing.rsvp.visualTag')}</p>
            <p className="obw-display landing-rsvp__visual-title">{t('landing.rsvp.visualTitle')}</p>
            <div className="obw-rule landing-rsvp__visual-rule" />
            <div className="landing-rsvp__visual-icons">
              <ClipboardList size={28} strokeWidth={1.25} />
              <Users size={28} strokeWidth={1.25} />
            </div>
            <p className="obw-body landing-rsvp__visual-caption">{t('landing.rsvp.visualCaption')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
