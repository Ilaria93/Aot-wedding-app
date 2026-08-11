import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
  guestLinesToDrafts,
} from '@/components/Rsvp/buildInitialGuestLines';
import type { ConfirmedRsvpState } from '@/components/Rsvp/RsvpConfirmedSummary';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import { validateRsvpGuestLines, type RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { isFactionId } from '@/constants/factions';
import type { TranslateFn } from '@/i18n/translations';
import { getApiStatusCode } from '@/services/apiErrors';
import { fetchMyRsvp, submitRsvpConfirmation, updateMyRsvp, type FactionId } from '@/services/rsvpApi';

type RsvpViewMode = 'form' | 'summary';

type AccountProfile = {
  first_name: string;
  last_name: string;
};

export type RsvpPartyLimits = {
  min: number;
  max: number;
};

export type UseRsvpDraftResult = {
  loading: boolean;
  error: string | null;
  viewMode: RsvpViewMode;
  editable: boolean;
  attending: boolean;
  guests: RsvpGuestDraft[];
  fieldErrors: RsvpGuestFieldError[];
  submitting: boolean;
  confirmedRsvp: ConfirmedRsvpState | null;
  hasExistingRsvp: boolean;
  /** null while loading — nothing renders the form before it's known. */
  partyLimits: RsvpPartyLimits | null;
  setAttending: (attending: boolean) => void;
  setGuests: (guests: RsvpGuestDraft[]) => void;
  beginEdit: () => void;
  cancelEdit: () => void;
  submit: () => Promise<void>;
};

/**
 * Owns the RSVP edit/view state machine: confirmed → edit → draft → submit →
 * back to confirmed. This is the seam — everything that used to be re-derived
 * by hand in beginEdit/cancelEdit now happens in one place, so it has a test
 * surface below "render the page."
 */
export function useRsvpDraft(accountProfile: AccountProfile, t: TranslateFn): UseRsvpDraftResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RsvpViewMode>('form');
  const [editable, setEditable] = useState(true);
  const [attending, setAttendingState] = useState(true);
  const [guests, setGuests] = useState<RsvpGuestDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<RsvpGuestFieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<ConfirmedRsvpState | null>(null);
  const [hasExistingRsvp, setHasExistingRsvp] = useState(false);
  const [partyLimits, setPartyLimits] = useState<RsvpPartyLimits | null>(null);

  const resetFormFromProfile = useCallback(() => {
    setAttendingState(true);
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
      setPartyLimits({ min: rsvp.min_party_guests, max: rsvp.max_party_guests });

      if (rsvp.has_rsvp) {
        const confirmedFaction =
          rsvp.attending && isFactionId(rsvp.faction) ? (rsvp.faction as FactionId) : null;
        const nextConfirmed: ConfirmedRsvpState = {
          attending: rsvp.attending ?? false,
          faction: confirmedFaction,
          guests: rsvp.guests,
        };
        setConfirmedRsvp(nextConfirmed);
        setAttendingState(rsvp.attending ?? false);
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

  /** Restores drafts from the last confirmed state — the one thing beginEdit and cancelEdit share. */
  const restoreDraftsFromConfirmed = useCallback(
    (confirmed: ConfirmedRsvpState) => {
      setAttendingState(confirmed.attending);
      setGuests(guestLinesToDrafts(confirmed.guests, accountProfile));
      setFieldErrors([]);
      setError(null);
    },
    [accountProfile],
  );

  const beginEdit = useCallback(() => {
    if (!confirmedRsvp || !editable) {
      return;
    }
    restoreDraftsFromConfirmed(confirmedRsvp);
    setViewMode('form');
  }, [confirmedRsvp, editable, restoreDraftsFromConfirmed]);

  const cancelEdit = useCallback(() => {
    if (!confirmedRsvp) {
      return;
    }
    restoreDraftsFromConfirmed(confirmedRsvp);
    setViewMode('summary');
  }, [confirmedRsvp, restoreDraftsFromConfirmed]);

  const setAttending = useCallback(
    (nextAttending: boolean) => {
      setAttendingState(nextAttending);
      if (nextAttending && guests.length === 0) {
        setGuests([buildAccountHolderGuestLine(accountProfile)]);
      }
    },
    [accountProfile, guests.length],
  );

  const submit = useCallback(async () => {
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
  }, [accountProfile, attending, guests, hasExistingRsvp, loadRsvp, t]);

  return useMemo(
    () => ({
      loading,
      error,
      viewMode,
      editable,
      attending,
      guests,
      fieldErrors,
      submitting,
      confirmedRsvp,
      hasExistingRsvp,
      partyLimits,
      setAttending,
      setGuests,
      beginEdit,
      cancelEdit,
      submit,
    }),
    [
      loading,
      error,
      viewMode,
      editable,
      attending,
      guests,
      fieldErrors,
      submitting,
      confirmedRsvp,
      hasExistingRsvp,
      partyLimits,
      setAttending,
      beginEdit,
      cancelEdit,
      submit,
    ],
  );
}
