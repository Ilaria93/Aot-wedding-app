import { useMemo } from 'react';

import { PageAlert } from '@/components/PageShell';
import { RsvpConfirmedSummary } from '@/components/Rsvp/RsvpConfirmedSummary';
import { RsvpPartyForm } from '@/components/Rsvp/RsvpPartyForm';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RsvpPageSkeleton } from '@/pages/RsvpPage/components/RsvpPageSkeleton';
import { useRsvpDraft } from '@/pages/RsvpPage/useRsvpDraft';
import './styles/RsvpPage.scss';

/** RSVP screen for the authenticated user at `/rsvp`. */
export function RsvpPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const accountProfile = useMemo(
    () => ({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
    }),
    [user?.first_name, user?.last_name],
  );

  const draft = useRsvpDraft(accountProfile, t);

  const guestName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const isEditMode = draft.hasExistingRsvp && draft.viewMode === 'form';

  if (draft.loading || !draft.partyLimits) {
    return <RsvpPageSkeleton />;
  }

  return (
    <div className="obw-page rsvp-page">
      <div className="obw-page__grain" aria-hidden="true" />

      <div className="obw-container rsvp-page__inner">
        <header className="obw-card obw-card--interactive rsvp-hero rsvp-hero--mission obw-fade-up">
          <p className="obw-kicker">{t('rsvp.eyebrow')}</p>
          <p className="obw-kicker rsvp-hero__phase">
            {draft.viewMode === 'summary' ? t('rsvp.phaseSummary') : t('rsvp.phaseForm')}
          </p>
          <h1 className="obw-display obw-display--lg">{guestName || t('rsvp.guestFallbackName')}</h1>
          <p className="obw-body obw-body--narrow">{t('rsvp.subtitle')}</p>
          <div className="obw-rule" aria-hidden="true" />
        </header>

        {draft.error ? (
          <div className="rsvp-alert-wrap">
            <PageAlert message={draft.error} />
          </div>
        ) : null}

        {draft.viewMode === 'summary' ? (
          <RsvpConfirmedSummary
            confirmedRsvp={draft.confirmedRsvp}
            editable={draft.editable}
            onEdit={draft.beginEdit}
          />
        ) : (
          <RsvpPartyForm
            attending={draft.attending}
            guests={draft.guests}
            submitting={draft.submitting}
            isEditMode={isEditMode}
            fieldErrors={draft.fieldErrors}
            partyLimits={draft.partyLimits}
            onAttendingChange={draft.setAttending}
            onGuestsChange={draft.setGuests}
            onSubmit={() => void draft.submit()}
            onCancelEdit={isEditMode ? draft.cancelEdit : undefined}
          />
        )}
      </div>
    </div>
  );
}
