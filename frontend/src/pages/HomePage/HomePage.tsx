import { CinematicHeroSection } from '@/components/cinematic/CinematicHeroSection';
import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import { apiBaseUrl } from '@/constants/apiConfig';
import { useI18n } from '@/contexts/I18nContext';
import { LandingCeremonySection } from '@/pages/HomePage/components/LandingCeremonySection';
import { LandingContactsSection } from '@/pages/HomePage/components/LandingContactsSection';
import { LandingFaqSection } from '@/pages/HomePage/components/LandingFaqSection';
import { LandingRsvpSection } from '@/pages/HomePage/components/LandingRsvpSection';
import { LandingStorySection } from '@/pages/HomePage/components/LandingStorySection';
import './styles/HomePage.scss';

/** Editorial wedding landing page. */
export function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <CinematicHeroSection />
      <div className="landing-page">
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
