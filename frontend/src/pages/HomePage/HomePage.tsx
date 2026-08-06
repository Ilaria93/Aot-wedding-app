import { GallerySection } from '@/components/Landing/GallerySection/GallerySection';
import { LandingCeremonySection } from '@/components/Landing/LandingCeremonySection';
import { LandingContactsSection } from '@/components/Landing/LandingContactsSection';
import { LandingFaqSection } from '@/components/Landing/LandingFaqSection';
import { LandingRsvpSection } from '@/components/Landing/LandingRsvpSection';
import { LandingStorySection } from '@/components/Landing/LandingStorySection';
import { MissionDocumentHero } from '@/components/MissionDocumentHero';
import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import './styles/HomePage.scss';

/** Editorial wedding landing page. */
export function HomePage() {
  return (
    <div className="landing-page">
      <MissionDocumentHero />
      <LandingStorySection />
      <LandingCeremonySection />
      <GallerySection />
      <LandingRsvpSection />
      <HoneymoonGiftSection />
      <LandingFaqSection />
      <LandingContactsSection />
    </div>
  );
}