import { apiClient } from '@/services/apiClient';

export type FactionId = 'scout_regiment' | 'military_police' | 'garrison';

export type RsvpMe = {
  has_rsvp: boolean;
  attending?: boolean | null;
  faction?: FactionId | null;
  dietary_notes?: string | null;
};

export type RsvpConfirmPayload = {
  attending: boolean;
  faction?: FactionId;
  dietary_notes?: string;
};

export type RsvpConfirmResponse = {
  ok: boolean;
  user: string;
  faction?: FactionId | null;
};

// Reads RSVP status for the logged-in user.
export async function fetchMyRsvp(): Promise<RsvpMe> {
  const { data } = await apiClient.get<RsvpMe>('/rsvp/me');
  return data;
}

// Submits RSVP confirmation for the logged-in user.
export async function submitRsvpConfirmation(
  payload: RsvpConfirmPayload,
): Promise<RsvpConfirmResponse> {
  const { data } = await apiClient.post<RsvpConfirmResponse>('/rsvp/confirm', payload);
  return data;
}
