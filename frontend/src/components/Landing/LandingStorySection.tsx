import { Link } from 'react-router-dom';

import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import { useI18n } from '@/contexts/I18nContext';
import './styles/LandingStorySection.scss';

const PORTRAITS = [
  { id: 'groom', src: '/assets/wedding/davide.webp', captionKey: 'landing.story.groomCaption' },
  { id: 'bride', src: '/assets/wedding/ilaria.webp', captionKey: 'landing.story.brideCaption' },
] as const;

/** Landing story section — seal, title and the two couple portraits. */
export function LandingStorySection() {
  const { t } = useI18n();

  return (
    <section className="obw-section obw-fade-up landing-story" id="story">
      <div className="obw-container landing-story__inner">
        <header className="landing-story__head">
          <MissionDocumentSeal />
          <h2 className="obw-display obw-display--lg">{t('landing.story.heading')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
          <Link to="/tema" className="obw-btn obw-btn--ghost">
            {t('landing.story.temaLink')}
          </Link>
        </header>

        <div className="landing-story__portraits">
          {PORTRAITS.map((portrait) => (
            <figure key={portrait.id} className="landing-story__portrait">
              <div className="landing-story__portrait-frame">
                <img src={portrait.src} alt="" loading="lazy" />
              </div>
              <figcaption className="landing-story__portrait-caption">
                {t(portrait.captionKey)}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="landing-story__copy">
          <p className="obw-body">{t('landing.story.paragraphOne')}</p>
          <p className="obw-body obw-body--flush">{t('landing.story.paragraphTwo')}</p>
        </div>
      </div>
    </section>
  );
}
