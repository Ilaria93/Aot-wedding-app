import { useI18n } from '@/contexts/I18nContext';

/** Landing story section with photo placeholders and narrative copy. */
export function LandingStorySection() {
  const { t } = useI18n();

  return (
    <section className="landing-story" id="story">
      <div className="landing-story__photos">
        <div className="landing-photo-frame">{t('landing.story.photoOne')}</div>
        <div className="landing-photo-frame landing-photo-frame--tall">{t('landing.story.photoTwo')}</div>
        <div className="landing-initial-badge">I & D</div>
      </div>
      <div className="landing-story__card">
        <h2 className="landing-section-heading">{t('landing.story.heading')}</h2>
        <p className="landing-body">{t('landing.story.paragraphOne')}</p>
        <p className="landing-body">{t('landing.story.paragraphTwo')}</p>
      </div>
    </section>
  );
}
