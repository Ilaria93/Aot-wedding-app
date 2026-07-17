import type { IntoleranceId, MealChoiceId } from '@/services/rsvpApi';

/** Editable guest row in the RSVP party form (client-only `clientId` for list keys). */
export type RsvpGuestDraft = {
  clientId: string;
  first_name: string;
  last_name: string;
  meal_choice: MealChoiceId;
  intolerance: IntoleranceId;
  dietary_notes: string;
  isAccountHolder: boolean;
};
