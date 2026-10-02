import { useCallback, useMemo, useState } from 'react';

import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
  guestLinesToDrafts,
} from '@/components/Rsvp/buildInitialGuestLines';
import type { ConfirmedRsvpState } from '@/components/Rsvp/RsvpConfirmedSummary';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import { validateRsvpGuestLines, type RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from '@/i18n/translations';
import { confirmGuestRsvp } from '@/services/guestAccessApi';
import { getApiStatusCode } from '@/services/apiErrors';
import { isFactionId } from '@/constants/factions';
import type { RsvpMe } from '@/services/rsvpApi';
import { mapGuestRsvpErrorToMessageKey } from '@/pages/GuestRsvpPage/mapGuestRsvpError';

type InvitePrefill = { first_name: string; last_name: string };

export type UseGuestRsvpDraftResult = {
  attending: boolean;
  guests: RsvpGuestDraft[];
  fieldErrors: RsvpGuestFieldError[];
  submitting: boolean;
  error: string | null;
  /** 'summary' once there is a saved answer to show, 'form' while filling or editing it. */
  viewMode: 'summary' | 'form';
  /** True once this visit saved an answer (the thank-you page), false when reopening a saved one. */
  justSubmitted: boolean;
  confirmedRsvp: ConfirmedRsvpState | null;
  editable: boolean;
  beginEdit: () => void;
  cancelEdit: () => void;
  setAttending: (attending: boolean) => void;
  setGuests: (guests: RsvpGuestDraft[]) => void;
  submit: () => Promise<void>;
};

/**
 * Same shape of concerns as `useRsvpDraft` (see pages/RsvpPage/useRsvpDraft.ts)
 * but driven by the invite link: the saved answer (if the guest already
 * confirmed) arrives as `existingRsvp` and opens on the summary; a successful
 * submit hands the guest a real session via `applySession`. No email is
 * collected: the invite link itself is the guest's only credential.
 */
export function useGuestRsvpDraft(
  token: string,
  invitePrefill: InvitePrefill,
  t: TranslateFn,
  existingRsvp: RsvpMe | null = null,
): UseGuestRsvpDraftResult {
  const { applySession } = useAuth();
  // Lazy: the hook is mounted once per page load, so the saved answer is read a single time.
  const [initialConfirmed] = useState<ConfirmedRsvpState | null>(() =>
    existingRsvp?.has_rsvp
      ? {
          attending: Boolean(existingRsvp.attending),
          faction: isFactionId(existingRsvp.faction) ? existingRsvp.faction : null,
          guests: existingRsvp.guests,
        }
      : null,
  );
  const [confirmedRsvp, setConfirmedRsvp] = useState<ConfirmedRsvpState | null>(initialConfirmed);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [editable, setEditable] = useState(existingRsvp?.editable ?? true);
  const [viewMode, setViewMode] = useState<'summary' | 'form'>(initialConfirmed ? 'summary' : 'form');
  const [attending, setAttendingState] = useState(initialConfirmed?.attending ?? true);
  const [guests, setGuests] = useState<RsvpGuestDraft[]>(() =>
    initialConfirmed
      ? guestLinesToDrafts(initialConfirmed.guests, invitePrefill)
      : [buildAccountHolderGuestLine(invitePrefill)],
  );
  const [fieldErrors, setFieldErrors] = useState<RsvpGuestFieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAttending = useCallback(
    (nextAttending: boolean) => {
      setAttendingState(nextAttending);
      if (nextAttending && guests.length === 0) {
        setGuests([buildAccountHolderGuestLine(invitePrefill)]);
      }
    },
    [guests.length, invitePrefill],
  );

  /** Puts the drafts back to the saved answer — what beginEdit and cancelEdit share. */
  const restoreDraftsFromConfirmed = useCallback(
    (confirmed: ConfirmedRsvpState) => {
      setAttendingState(confirmed.attending);
      setGuests(guestLinesToDrafts(confirmed.guests, invitePrefill));
      setFieldErrors([]);
      setError(null);
    },
    [invitePrefill],
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

      const submittedGuests = attending ? draftsToGuestPayload(guests) : [];
      const result = await confirmGuestRsvp(token, { attending, guests: submittedGuests });

      await applySession(result.user);
      setConfirmedRsvp({
        attending,
        faction: isFactionId(result.rsvp.faction) ? result.rsvp.faction : null,
        guests: submittedGuests,
      });
      // Just saved inside the edit window, so it can still be edited.
      setEditable(true);
      setViewMode('summary');
      setJustSubmitted(true);
    } catch (caughtError) {
      const statusCode = getApiStatusCode(caughtError);
      setError(t(mapGuestRsvpErrorToMessageKey(statusCode)));
    } finally {
      setSubmitting(false);
    }
  }, [applySession, attending, guests, t, token]);

  return useMemo(
    () => ({
      attending,
      guests,
      fieldErrors,
      submitting,
      error,
      viewMode,
      justSubmitted,
      confirmedRsvp,
      editable,
      beginEdit,
      cancelEdit,
      setAttending,
      setGuests,
      submit,
    }),
    [attending, guests, fieldErrors, submitting, error, viewMode, justSubmitted, confirmedRsvp, editable, beginEdit, cancelEdit, setAttending, submit],
  );
}
