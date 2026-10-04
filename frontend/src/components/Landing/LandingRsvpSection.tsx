import { useState } from 'react';

import { InviteRequestDialog } from '@/components/Landing/InviteRequestDialog';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import './styles/LandingRsvpSection.scss';

const RSVP_STEP_KEYS = ['stepOne', 'stepTwo'] as const;

/** Landing RSVP section: title header, then the briefing card with steps and CTA. */
export function LandingRsvpSection() {
  const { t } = useI18n();
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <section className="obw-section landing-rsvp obw-fade-up" id="rsvp">
      <div className="obw-container landing-rsvp__inner">
        <header className="landing-rsvp__head">
          <p className="obw-kicker">{t('landing.rsvp.visualTag')}</p>
          <h2 className="obw-display obw-display--lg">{t('landing.rsvp.visualTitle')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>

        <div className="obw-card obw-card--dark obw-card--interactive landing-rsvp__briefing">
          <div className="obw-card__texture" aria-hidden="true" />
          <div className="landing-rsvp__briefing-body">
            <p className="obw-kicker obw-kicker--light">{t('landing.rsvp.eyebrow')}</p>
            <h3 className="obw-display obw-display--lg obw-display--light">
              {t('landing.rsvp.heading')}
            </h3>
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

            <p className="obw-body landing-rsvp__invite-note">{t('landing.rsvp.inviteNote')}</p>

            {/* Guests answer from their personal WhatsApp link; this is for
                whoever reaches the site without it. */}
            <button type="button" className="obw-btn landing-rsvp__cta" onClick={() => setRequestOpen(true)}>
              {t('landing.rsvp.requestButton')}
            </button>
          </div>
        </div>
      </div>

      <InviteRequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
    </section>
  );
}
