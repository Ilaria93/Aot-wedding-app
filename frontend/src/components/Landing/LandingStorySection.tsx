import { useI18n } from '@/contexts/I18nContext';
import './styles/LandingStorySection.scss';

/** Landing story section with wedding photos and narrative copy. */
export function LandingStorySection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-fade-up landing-story" id="story">
      <div className="obw-container obw-split">
        <div className="obw-photo-mosaic" aria-hidden>
          <div className="obw-photo-mosaic__frame obw-photo-mosaic__frame--first">
            <img src="/assets/wedding/davide.webp" alt="" loading="lazy" />
          </div>
          <div className="obw-photo-mosaic__frame obw-photo-mosaic__frame--tall obw-photo-mosaic__frame--second">
            <img src="/assets/wedding/ilaria.webp" alt="" loading="lazy" />
          </div>
          <div className="obw-photo-mosaic__monogram">D & I</div>
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