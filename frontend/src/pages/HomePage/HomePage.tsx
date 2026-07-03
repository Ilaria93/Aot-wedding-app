import { CinematicHeroSection } from '@/cinematic';
import { MissionDocumentHero } from '@/components/MissionDocumentHero';
import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import { apiBaseUrl } from '@/constants/apiConfig';
import { isCinematicHeroEnabled } from '@/constants/cinematicHero';
import { useHeroScroll } from '@/contexts/HeroScrollContext';
import { useI18n } from '@/contexts/I18nContext';
import { LandingCeremonySection } from '@/components/Landing/LandingCeremonySection';
import { LandingContactsSection } from '@/components/Landing/LandingContactsSection';
import { LandingFaqSection } from '@/components/Landing/LandingFaqSection';
import { LandingRsvpSection } from '@/components/Landing/LandingRsvpSection';
import { LandingStorySection } from '@/components/Landing/LandingStorySection';
import './styles/HomePage.scss';

/** Editorial wedding landing page. */
export function HomePage() {
  const { t } = useI18n();
  const { isHeroScrollActive } = useHeroScroll();
  const cinematicHeroEnabled = isCinematicHeroEnabled();
  const landingClassName = `landing-page${
    cinematicHeroEnabled && isHeroScrollActive ? ' landing-page--hero-active' : ''
  }`;

  return (
    <>
      {cinematicHeroEnabled ? <CinematicHeroSection /> : null}
      <div className={landingClassName}>
        <MissionDocumentHero />
        <LandingStorySection />
        <LandingCeremonySection />
        <LandingRsvpSection />
        <HoneymoonGiftSection />
        <LandingFaqSection />
        <LandingContactsSection />
        <p className="landing-api">{t('landing.apiConnected', { apiBaseUrl })}</p>
      </div>
    </>
  );
}
