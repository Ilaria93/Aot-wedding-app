import { useI18n } from '@/contexts/I18nContext';

/** Landing story section with photo placeholders and narrative copy. */
export function LandingStorySection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-fade-up" id="story">
      <div className="obw-container obw-split">
        <div className="obw-photo-mosaic" aria-hidden>
          <div className="obw-photo-mosaic__frame">{t('landing.story.photoOne')}</div>
          <div className="obw-photo-mosaic__frame obw-photo-mosaic__frame--tall">
            {t('landing.story.photoTwo')}
          </div>
          <div className="obw-photo-mosaic__monogram">I & D</div>
        </div>
        <div className="obw-card obw-card--interactive">
          <h2 className="obw-display obw-display--sm">{t('landing.story.heading')}</h2>
          <div className="obw-rule" aria-hidden="true" />
          <p className="obw-body">{t('landing.story.paragraphOne')}</p>
          <p className="obw-body">{t('landing.story.paragraphTwo')}</p>
        </div>
      </div>
    </section>
  );
}
