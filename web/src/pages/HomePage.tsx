import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';

import { HeroPlaceholder } from '@/components/HeroPlaceholder';
import { HoneymoonGiftSection } from '@/components/HoneymoonGiftSection';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { apiBaseUrl } from '@/constants/apiConfig';
import {
  formatWeddingDateDisplay,
  formatWeddingTimeDisplay,
} from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { createGuestInvitation } from '@/services/guestApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

/** Editorial wedding landing — cinematic hero slot reserved for a later merge. */
export function HomePage() {
  const navigate = useNavigate();
  const { canManageWedding, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [invitationToken, setInvitationToken] = useState('');
  const [guestFullName, setGuestFullName] = useState('');
  const [createInviteError, setCreateInviteError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  function scrollToSection(sectionId: string) {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div className="page-shell">
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <p className="landing-nav__title">Ilaria & Davide</p>
          <p className="landing-nav__subtitle">Operation Ravenna</p>
        </div>
        <nav className="landing-nav__links" aria-label="Landing">
          <button type="button" onClick={() => scrollToSection('story')}>
            {t('landing.nav.story')}
          </button>
          <button type="button" onClick={() => scrollToSection('ceremony')}>
            {t('landing.nav.ceremony')}
          </button>
          <button type="button" onClick={() => scrollToSection('rsvp')}>
            {t('landing.nav.rsvp')}
          </button>
          <button type="button" onClick={() => scrollToSection('gift')}>
            {t('landing.nav.gift')}
          </button>
          <Link to="/profile">{isAuthenticated ? t('landing.nav.profile') : t('landing.nav.login')}</Link>
          {canManageWedding ? <Link to="/admin">{t('landing.nav.admin')}</Link> : null}
          <LanguageSwitcher compact />
        </nav>
      </header>

      <HeroPlaceholder />

      <section className="hero-editorial landing-section" id="story" ref={(node) => { sectionRefs.current.story = node; }}>
        <div className="floating-blob top" aria-hidden />
        <div className="floating-blob bottom" aria-hidden />
        <div className="hero-editorial__inner">
          <p className="eyebrow">{t('landing.hero.eyebrow')}</p>
          <h2 className="hero-editorial__names">ILARIA</h2>
          <p className="hero-editorial__ampersand">&</p>
          <h2 className="hero-editorial__names">DAVIDE</h2>
          <button type="button" className="button button-primary" onClick={() => scrollToSection('rsvp')}>
            {t('landing.hero.button')}
          </button>
        </div>
      </section>

      <section className="landing-section landing-grid two-col">
        <div className="story-photos">
          <div className="photo-frame">{t('landing.story.photoOne')}</div>
          <div className="photo-frame tall">{t('landing.story.photoTwo')}</div>
        </div>
        <div className="card" style={{ maxWidth: 'none' }}>
          <h2 className="section-heading">{t('landing.story.heading')}</h2>
          <p className="subtitle">{t('landing.story.paragraphOne')}</p>
          <p className="subtitle">{t('landing.story.paragraphTwo')}</p>
        </div>
      </section>

      <section
        className="landing-section landing-grid two-col"
        id="ceremony"
        ref={(node) => {
          sectionRefs.current.ceremony = node;
        }}>
        <div className="card" style={{ maxWidth: 'none' }}>
          <h2 className="section-heading">{t('landing.ceremony.heading')}</h2>
          <p>{formatWeddingDateDisplay(locale)}</p>
          <p>{formatWeddingTimeDisplay(locale)}</p>
          <p>{t('landing.ceremony.venue')}</p>
          <p>{t('landing.ceremony.city')}</p>
          <p className="helper-text">{t('landing.ceremony.body')}</p>
        </div>
        <div className="photo-frame tall">{t('landing.ceremony.artworkPlaceholder')}</div>
      </section>

      <section
        className="landing-section"
        id="rsvp"
        ref={(node) => {
          sectionRefs.current.rsvp = node;
        }}>
        <h2 className="section-heading">{t('landing.rsvp.heading')}</h2>
        <p className="subtitle">{t('landing.rsvp.body')}</p>
        <button type="button" className="button button-primary" onClick={() => scrollToSection('devTools')}>
          {t('landing.rsvp.button')}
        </button>
      </section>

      <HoneymoonGiftSection />

      <section
        className="landing-section"
        id="devTools"
        ref={(node) => {
          sectionRefs.current.devTools = node;
        }}>
        <h2 className="section-heading">{t('landing.devTools.title')}</h2>
        <p className="subtitle">{t('landing.devTools.description')}</p>
        <div className="dev-grid">
          <div className="dev-card">
            <h3>{t('landing.devTools.generate.title')}</h3>
            <input
              className="input"
              placeholder={t('landing.devTools.generate.placeholder')}
              value={guestFullName}
              onChange={(event) => setGuestFullName(event.target.value)}
            />
            <button
              type="button"
              className="button button-primary"
              disabled={!guestFullName.trim() || isCreatingInvite || !canManageWedding}
              onClick={() => void createInviteAndOpenRsvp()}>
              {isCreatingInvite
                ? t('landing.devTools.generate.loadingButton')
                : t('landing.devTools.generate.button')}
            </button>
            {createInviteError ? <p className="error-text">{createInviteError}</p> : null}
            {!canManageWedding ? <p className="helper-text">{t('landing.devTools.generate.hint')}</p> : null}
          </div>
          <div className="dev-card">
            <h3>{t('landing.devTools.open.title')}</h3>
            <input
              className="input"
              placeholder={t('landing.devTools.open.placeholder')}
              value={invitationToken}
              onChange={(event) => setInvitationToken(event.target.value)}
            />
            <button
              type="button"
              className="button button-secondary"
              disabled={!invitationToken.trim()}
              onClick={openInvitationLink}>
              {t('landing.devTools.open.button')}
            </button>
            <p className="link-row">
              <Link className="text-link" to="/rsvp/demo-token-001">
                {t('landing.devTools.open.demoLink')}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <p className="helper-text" style={{ marginTop: 32 }}>
        {t('landing.apiConnected', { apiBaseUrl })}
      </p>
    </div>
  );
}
