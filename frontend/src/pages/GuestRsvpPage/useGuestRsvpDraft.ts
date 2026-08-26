import { useCallback, useMemo, useState } from 'react';

import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
} from '@/components/Rsvp/buildInitialGuestLines';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import { validateRsvpGuestLines, type RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from '@/i18n/translations';
import { confirmGuestRsvp } from '@/services/guestAccessApi';
import { getApiStatusCode } from '@/services/apiErrors';
import { isFactionId } from '@/constants/factions';
import type { FactionId } from '@/services/rsvpApi';
import { mapGuestRsvpErrorToMessageKey } from '@/pages/GuestRsvpPage/mapGuestRsvpError';

type InvitePrefill = { first_name: string; last_name: string };

export type UseGuestRsvpDraftResult = {
  attending: boolean;
  guests: RsvpGuestDraft[];
  fieldErrors: RsvpGuestFieldError[];
  submitting: boolean;
  error: string | null;
  confirmed: boolean;
  confirmedFaction: FactionId | null;
  setAttending: (attending: boolean) => void;
  setGuests: (guests: RsvpGuestDraft[]) => void;
  /** Reads the current email from a ref so this can be passed straight as
   * RsvpPartyForm's onSubmit (which takes no arguments) — see GuestRsvpPage. */
  submit: () => Promise<void>;
  email: string;
  setEmail: (email: string) => void;
};

/**
 * Same shape of concerns as `useRsvpDraft` (see pages/RsvpPage/useRsvpDraft.ts)
 * but for the *unauthenticated first confirmation only* — there is no
 * existing RSVP to load, and a successful submit hands the guest a real
 * session via `applySession` instead of just updating local state.
 */
export function useGuestRsvpDraft(
  token: string,
  invitePrefill: InvitePrefill,
  t: TranslateFn,
): UseGuestRsvpDraftResult {
  const { applySession } = useAuth();
  const [attending, setAttendingState] = useState(true);
  const [guests, setGuests] = useState<RsvpGuestDraft[]>(() => [
    buildAccountHolderGuestLine(invitePrefill),
  ]);
  const [fieldErrors, setFieldErrors] = useState<RsvpGuestFieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedFaction, setConfirmedFaction] = useState<FactionId | null>(null);
  const [email, setEmail] = useState('');

  const setAttending = useCallback(
    (nextAttending: boolean) => {
      setAttendingState(nextAttending);
      if (nextAttending && guests.length === 0) {
        setGuests([buildAccountHolderGuestLine(invitePrefill)]);
      }
    },
    [guests.length, invitePrefill],
  );

  const submit = useCallback(async () => {
    if (!email.trim()) {
      setError(t('guestRsvp.emailRequiredError'));
      return;
    }
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

      const result = await confirmGuestRsvp(token, {
        email: email.trim(),
        attending,
        guests: attending ? draftsToGuestPayload(guests) : [],
      });

      await applySession(result.session);
      setConfirmedFaction(isFactionId(result.rsvp.faction) ? result.rsvp.faction : null);
      setConfirmed(true);
    } catch (caughtError) {
      const statusCode = getApiStatusCode(caughtError);
      setError(t(mapGuestRsvpErrorToMessageKey(statusCode)));
    } finally {
      setSubmitting(false);
    }
  }, [applySession, attending, email, guests, t, token]);

  return useMemo(
    () => ({
      attending,
      guests,
      fieldErrors,
      submitting,
      error,
      confirmed,
      confirmedFaction,
      email,
      setAttending,
      setGuests,
      setEmail,
      submit,
    }),
    [
      attending,
      guests,
      fieldErrors,
      submitting,
      error,
      confirmed,
      confirmedFaction,
      email,
      setAttending,
      submit,
    ],
  );
}
