import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import { apiBaseUrl } from '@/constants/apiConfig';
import { useI18n } from '@/contexts/I18nContext';
import { LandingCeremonySection } from '@/pages/HomePage/components/LandingCeremonySection';
import { LandingContactsSection } from '@/pages/HomePage/components/LandingContactsSection';
import { LandingDevToolsSection } from '@/pages/HomePage/components/LandingDevToolsSection';
import { LandingFaqSection } from '@/pages/HomePage/components/LandingFaqSection';
import { LandingHeroSection } from '@/pages/HomePage/components/LandingHeroSection';
import { LandingRsvpSection } from '@/pages/HomePage/components/LandingRsvpSection';
import { LandingStorySection } from '@/pages/HomePage/components/LandingStorySection';
import { createGuestInvitation } from '@/services/guestApi';
import { getApiErrorMessage } from '@/services/apiErrors';
import './styles/HomePage.scss';

/** Editorial wedding landing page. */
export function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [invitationToken, setInvitationToken] = useState('');
  const [guestFullName, setGuestFullName] = useState('');
  const [createInviteError, setCreateInviteError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openInvitationLink() {
    const normalizedToken = invitationToken.trim();
    if (normalizedToken) {
      navigate(`/rsvp/${encodeURIComponent(normalizedToken)}`);
    }
  }

  async function createInviteAndOpenRsvp() {
    const normalizedGuestFullName = guestFullName.trim();
    if (!normalizedGuestFullName) {
      setCreateInviteError(t('landing.devTools.generate.emptyNameError'));
      return;
    }

    try {
      setIsCreatingInvite(true);
      setCreateInviteError(null);
      const createdInvitation = await createGuestInvitation({ full_name: normalizedGuestFullName });
      setInvitationToken(createdInvitation.invitation_token);
      navigate(`/rsvp/${encodeURIComponent(createdInvitation.invitation_token)}`);
    } catch (caughtError) {
      setCreateInviteError(
        getApiErrorMessage(caughtError, t('landing.devTools.generate.createError')),
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  return (
    <div className="landing-page">
      <LandingHeroSection onScrollToRsvp={() => scrollToSection('rsvp')} />
      <LandingStorySection />
      <LandingCeremonySection />
      <LandingRsvpSection onScrollToDevTools={() => scrollToSection('devTools')} />
      <HoneymoonGiftSection />
      <LandingDevToolsSection
        guestFullName={guestFullName}
        invitationToken={invitationToken}
        createInviteError={createInviteError}
        isCreatingInvite={isCreatingInvite}
        onGuestFullNameChange={setGuestFullName}
        onInvitationTokenChange={setInvitationToken}
        onCreateInvite={() => void createInviteAndOpenRsvp()}
        onOpenInvitation={openInvitationLink}
      />
      <LandingFaqSection />
      <LandingContactsSection />
      <p className="landing-api">{t('landing.apiConnected', { apiBaseUrl })}</p>
    </div>
  );
}
