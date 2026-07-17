import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageAlert } from '@/components/PageShell';
import { isFactionId } from '@/constants/factions';
import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
  guestLinesToDrafts,
} from '@/components/Rsvp/buildInitialGuestLines';
import { RsvpConfirmedSummary } from '@/components/Rsvp/RsvpConfirmedSummary';
import type { ConfirmedRsvpState } from '@/components/Rsvp/RsvpConfirmedSummary';
import { RsvpPartyForm } from '@/components/Rsvp/RsvpPartyForm';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import { validateRsvpGuestLines } from '@/components/Rsvp/validateRsvpGuestLines';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RsvpPageSkeleton } from '@/pages/RsvpPage/components/RsvpPageSkeleton';
import {
  fetchMyRsvp,
  submitRsvpConfirmation,
  updateMyRsvp,
  type FactionId,
} from '@/services/rsvpApi';
import { getApiStatusCode } from '@/services/apiErrors';
import './styles/RsvpPage.scss';

type RsvpViewMode = 'form' | 'summary';

/** RSVP screen for the authenticated user at `/rsvp`. */
export function RsvpPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RsvpViewMode>('form');
  const [editable, setEditable] = useState(true);
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState<RsvpGuestDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateRsvpGuestLines>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<ConfirmedRsvpState | null>(null);
  const [hasExistingRsvp, setHasExistingRsvp] = useState(false);

  const accountProfile = useMemo(
    () => ({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
    }),
    [user?.first_name, user?.last_name],
  );

  const resetFormFromProfile = useCallback(() => {
    setAttending(true);
    setGuests([buildAccountHolderGuestLine(accountProfile)]);
    setFieldErrors([]);
  }, [accountProfile]);

  const loadRsvp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rsvp = await fetchMyRsvp();
      setHasExistingRsvp(rsvp.has_rsvp);
      setEditable(rsvp.editable);

      if (rsvp.has_rsvp) {
        const confirmedFaction =
          rsvp.attending && isFactionId(rsvp.faction) ? (rsvp.faction as FactionId) : null;
        const nextConfirmed: ConfirmedRsvpState = {
          attending: rsvp.attending ?? false,
          faction: confirmedFaction,
          guests: rsvp.guests,
        };
        setConfirmedRsvp(nextConfirmed);
        setAttending(rsvp.attending ?? false);
        setGuests(guestLinesToDrafts(rsvp.guests, accountProfile));
        setViewMode('summary');
      } else {
        setConfirmedRsvp(null);
        resetFormFromProfile();
        setViewMode('form');
      }
    } catch {
      setError(t('rsvp.loadError'));
    } finally {
      setLoading(false);
    }
  }, [accountProfile, resetFormFromProfile, t]);

  useEffect(() => {
    void loadRsvp();
  }, [loadRsvp]);

  function beginEdit() {
    if (!confirmedRsvp || !editable) {
      return;
    }
    setAttending(confirmedRsvp.attending);
    setGuests(guestLinesToDrafts(confirmedRsvp.guests, accountProfile));
    setFieldErrors([]);
    setError(null);
    setViewMode('form');
  }

  function cancelEdit() {
    if (!confirmedRsvp) {
      return;
    }
    setAttending(confirmedRsvp.attending);
    setGuests(guestLinesToDrafts(confirmedRsvp.guests, accountProfile));
    setFieldErrors([]);
    setError(null);
    setViewMode('summary');
  }

  async function handleSubmit() {
    if (attending) {
      const validationErrors = validateRsvpGuestLines(guests);
      if (validationErrors.length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
    }

    setFieldErrors([]);

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        attending,
        guests: attending ? draftsToGuestPayload(guests) : [],
      };

      const response = hasExistingRsvp
        ? await updateMyRsvp(payload)
        : await submitRsvpConfirmation(payload);

      const nextConfirmed: ConfirmedRsvpState = {
        attending,
        faction: attending && isFactionId(response.faction) ? response.faction : null,
        guests: payload.guests,
      };

      setConfirmedRsvp(nextConfirmed);
      setHasExistingRsvp(true);
      setGuests(guestLinesToDrafts(nextConfirmed.guests, accountProfile));
      setViewMode('summary');
    } catch (caughtError) {
      const statusCode = getApiStatusCode(caughtError);
      if (statusCode === 409) {
        await loadRsvp();
        setError(t('rsvp.alreadyConfirmedError'));
      } else if (statusCode === 403) {
        await loadRsvp();
        setError(t('rsvp.deadlineClosedError'));
      } else {
        setError(t('rsvp.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const guestName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const isEditMode = hasExistingRsvp && viewMode === 'form';

  if (loading) {
    return <RsvpPageSkeleton />;
  }

  return (
    <div className="obw-page rsvp-page">
      <div className="obw-page__grain" aria-hidden="true" />

      <div className="obw-container rsvp-page__inner">
        <header className="obw-card obw-card--interactive rsvp-hero rsvp-hero--mission obw-fade-up">
          <p className="obw-kicker">{t('rsvp.eyebrow')}</p>
          <p className="obw-kicker rsvp-hero__phase">
            {viewMode === 'summary' ? t('rsvp.phaseSummary') : t('rsvp.phaseForm')}
          </p>
          <h1 className="obw-display obw-display--lg">{guestName || t('rsvp.guestFallbackName')}</h1>
          <p className="obw-body obw-body--narrow">{t('rsvp.subtitle')}</p>
          <div className="obw-rule" aria-hidden="true" />
        </header>

        {error ? (
          <div className="rsvp-alert-wrap">
            <PageAlert message={error} />
          </div>
        ) : null}

        {viewMode === 'summary' ? (
          <RsvpConfirmedSummary
            confirmedRsvp={confirmedRsvp}
            editable={editable}
            onEdit={beginEdit}
          />
        ) : (
          <RsvpPartyForm
            attending={attending}
            guests={guests}
            submitting={submitting}
            isEditMode={isEditMode}
            fieldErrors={fieldErrors}
            onAttendingChange={(nextAttending) => {
              setAttending(nextAttending);
              if (nextAttending && guests.length === 0) {
                setGuests([buildAccountHolderGuestLine(accountProfile)]);
              }
            }}
            onGuestsChange={setGuests}
            onSubmit={() => void handleSubmit()}
            onCancelEdit={isEditMode ? cancelEdit : undefined}
          />
        )}
      </div>
    </div>
  );
}
