import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

type LandingDevToolsSectionProps = {
  guestFullName: string;
  invitationToken: string;
  createInviteError: string | null;
  isCreatingInvite: boolean;
  onGuestFullNameChange: (value: string) => void;
  onInvitationTokenChange: (value: string) => void;
  onCreateInvite: () => void;
  onOpenInvitation: () => void;
};

/** Dev tools section for generating and opening RSVP invitation links. */
export function LandingDevToolsSection({
  guestFullName,
  invitationToken,
  createInviteError,
  isCreatingInvite,
  onGuestFullNameChange,
  onInvitationTokenChange,
  onCreateInvite,
  onOpenInvitation,
}: LandingDevToolsSectionProps) {
  const { canManageWedding } = useAuth();
  const { t } = useI18n();

  return (
    <section className="landing-dev-tools" id="devTools">
      <h2 className="landing-dev-tools__title">{t('landing.devTools.title')}</h2>
      <p className="landing-dev-tools__description">{t('landing.devTools.description')}</p>
      <div className="landing-dev-grid">
        <div className="landing-dev-card">
          <h3>{t('landing.devTools.generate.title')}</h3>
          <input
            className="landing-input"
            placeholder={t('landing.devTools.generate.placeholder')}
            value={guestFullName}
            onChange={(event) => onGuestFullNameChange(event.target.value)}
          />
          <button
            type="button"
            className="landing-button landing-button--primary"
            disabled={!guestFullName.trim() || isCreatingInvite || !canManageWedding}
            onClick={onCreateInvite}>
            {isCreatingInvite
              ? t('landing.devTools.generate.loadingButton')
              : t('landing.devTools.generate.button')}
          </button>
          {createInviteError ? <p className="landing-error">{createInviteError}</p> : null}
          {!canManageWedding ? <p className="landing-hint">{t('landing.devTools.generate.hint')}</p> : null}
        </div>
        <div className="landing-dev-card">
          <h3>{t('landing.devTools.open.title')}</h3>
          <input
            className="landing-input"
            placeholder={t('landing.devTools.open.placeholder')}
            value={invitationToken}
            onChange={(event) => onInvitationTokenChange(event.target.value)}
          />
          <button
            type="button"
            className="landing-button landing-button--secondary"
            disabled={!invitationToken.trim()}
            onClick={onOpenInvitation}>
            {t('landing.devTools.open.button')}
          </button>
          <Link className="landing-link" to="/rsvp/demo-token-001">
            {t('landing.devTools.open.demoLink')}
          </Link>
        </div>
      </div>
    </section>
  );
}
