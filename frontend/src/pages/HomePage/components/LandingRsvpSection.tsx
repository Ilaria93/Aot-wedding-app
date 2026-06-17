import { useI18n } from '@/contexts/I18nContext';

type LandingRsvpSectionProps = {
  onScrollToDevTools: () => void;
};

/** Landing RSVP call-to-action section. */
export function LandingRsvpSection({ onScrollToDevTools }: LandingRsvpSectionProps) {
  const { t } = useI18n();

  return (
    <section className="landing-rsvp" id="rsvp">
      <h2 className="landing-rsvp__heading">{t('landing.rsvp.heading')}</h2>
      <p className="landing-rsvp__body">{t('landing.rsvp.body')}</p>
      <button type="button" className="landing-hero__button" onClick={onScrollToDevTools}>
        {t('landing.rsvp.button')}
      </button>
    </section>
  );
}
