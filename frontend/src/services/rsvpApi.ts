import { apiClient } from '@/services/apiClient';

export type FactionId = 'scout_regiment' | 'military_police' | 'garrison';

export type MealChoiceId = 'standard' | 'vegetarian' | 'vegan' | 'gluten_free' | 'baby';

export type IntoleranceId =
  | 'none'
  | 'gluten'
  | 'lactose'
  | 'eggs'
  | 'nuts'
  | 'seafood'
  | 'other';

export type RsvpGuestLine = {
  first_name: string;
  last_name: string;
  meal_choice: MealChoiceId;
  intolerance: IntoleranceId;
  dietary_notes?: string | null;
};

export type RsvpMe = {
  has_rsvp: boolean;
  attending?: boolean | null;
  faction?: FactionId | null;
  guests: RsvpGuestLine[];
  editable: boolean;
};

export type RsvpSubmitPayload = {
  attending: boolean;
  guests: RsvpGuestLine[];
};

export type RsvpSubmitResponse = {
  ok: boolean;
  user: string;
  faction?: FactionId | null;
  guest_count: number;
};

/** Reads RSVP status for the logged-in user. */
export async function fetchMyRsvp(): Promise<RsvpMe> {
  const { data } = await apiClient.get<RsvpMe>('/rsvp/me');
  return data;
}

/** Submits the first RSVP confirmation for the logged-in user. */
export async function submitRsvpConfirmation(
  payload: RsvpSubmitPayload,
): Promise<RsvpSubmitResponse> {
  const { data } = await apiClient.post<RsvpSubmitResponse>('/rsvp/confirm', payload);
  return data;
}

/** Updates an existing RSVP for the logged-in user. */
export async function updateMyRsvp(payload: RsvpSubmitPayload): Promise<RsvpSubmitResponse> {
  const { data } = await apiClient.patch<RsvpSubmitResponse>('/rsvp/me', payload);
  return data;
}
