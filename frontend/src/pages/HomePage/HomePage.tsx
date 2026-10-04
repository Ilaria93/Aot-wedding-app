import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Gallery temporarily hidden from the home page — restore this import and the section below.
// import { GallerySection } from '@/components/Landing/GallerySection/GallerySection';
import { LandingCeremonySection } from '@/components/Landing/LandingCeremonySection';
import { LandingContactsSection } from '@/components/Landing/LandingContactsSection';
import { LandingFaqSection } from '@/components/Landing/LandingFaqSection';
import { LandingRsvpSection } from '@/components/Landing/LandingRsvpSection';
import { LandingStorySection } from '@/components/Landing/LandingStorySection';
import { LandingThemeSection } from '@/components/Landing/LandingThemeSection';
import { MissionDocumentHero } from '@/components/MissionDocumentHero';
import { HeroParticleField } from '@/components/MissionDocumentHero/HeroParticleField';
import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import './styles/HomePage.scss';

/** Editorial wedding landing page. */
export function HomePage() {
  const veilRef = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();

  // Nav links from other pages land on "/#section": the browser tries to jump
  // before React has rendered the section, so do it once it exists. Instant:
  // the page-wide smooth scroll gets cancelled while the page is still loading.
  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'instant' });
    }
  }, [hash]);

  // Fade the blur veil in across the whole scroll: 0 on the hero, 1 at the page foot.
  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      veilRef.current?.style.setProperty('--veil', progress.toFixed(3));
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="landing-page">
      <div ref={veilRef} className="landing-veil" aria-hidden />
      <HeroParticleField />
      <MissionDocumentHero />
      <div className="landing-page__body">
        <LandingThemeSection />
        <LandingStorySection />
        <LandingCeremonySection />
        {/* Gallery temporarily hidden — uncomment to bring it back. */}
        {/* <GallerySection /> */}
        <LandingRsvpSection />
        <HoneymoonGiftSection />
        <LandingFaqSection />
        <LandingContactsSection />
      </div>
    </div>
  );
}
