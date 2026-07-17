import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import type { RsvpGuestLine } from '@/services/rsvpApi';

type AccountProfile = {
  first_name: string;
  last_name: string;
};

let guestLineCounter = 0;

function nextGuestClientId(): string {
  guestLineCounter += 1;
  return `guest-${guestLineCounter}`;
}

/** Creates the first guest row from the logged-in account (names locked in the form). */
export function buildAccountHolderGuestLine(profile: AccountProfile): RsvpGuestDraft {
  return {
    clientId: 'account-holder',
    first_name: profile.first_name.trim(),
    last_name: profile.last_name.trim(),
    meal_choice: 'standard',
    intolerance: 'none',
    dietary_notes: '',
    isAccountHolder: true,
  };
}

/** Maps API guest lines into editable drafts; row 1 always mirrors the account profile. */
export function guestLinesToDrafts(
  guests: RsvpGuestLine[],
  profile: AccountProfile,
): RsvpGuestDraft[] {
  if (guests.length === 0) {
    return [buildAccountHolderGuestLine(profile)];
  }

  return guests.map((guest, index) => ({
    clientId: index === 0 ? 'account-holder' : nextGuestClientId(),
    first_name: index === 0 ? profile.first_name.trim() : guest.first_name,
    last_name: index === 0 ? profile.last_name.trim() : guest.last_name,
    meal_choice: guest.meal_choice,
    intolerance: guest.intolerance,
    dietary_notes: guest.dietary_notes ?? '',
    isAccountHolder: index === 0,
  }));
}

/** Creates a blank additional guest row. */
export function buildEmptyGuestLine(): RsvpGuestDraft {
  return {
    clientId: nextGuestClientId(),
    first_name: '',
    last_name: '',
    meal_choice: 'standard',
    intolerance: 'none',
    dietary_notes: '',
    isAccountHolder: false,
  };
}

/** Strips client-only fields before sending to the API. */
export function draftsToGuestPayload(guests: RsvpGuestDraft[]) {
  return guests.map((guest) => ({
    first_name: guest.first_name.trim(),
    last_name: guest.last_name.trim(),
    meal_choice: guest.meal_choice,
    intolerance: guest.intolerance,
    dietary_notes: guest.dietary_notes.trim() || undefined,
  }));
}
