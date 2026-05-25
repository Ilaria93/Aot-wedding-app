import { apiClient, withAdminHeaders } from '@/services/apiClient';

export type GuestPublic = {
  full_name: string;
  invitation_token: string;
};

export type GuestInvitationCreatePayload = {
  full_name: string;
};

export type GuestInvitationCreateResponse = {
  guest_id: number;
  full_name: string;
  invitation_token: string;
};

export type RsvpLookup = {
  has_rsvp: boolean;
  guest_full_name: string;
  attending?: boolean;
  faction?: FactionId | null;
  dietary_notes?: string | null;
};

export type FactionId = 'scout_regiment' | 'military_police' | 'garrison';

export type RsvpConfirmPayload = {
  invitation_token: string;
  attending: boolean;
  faction?: FactionId;
  dietary_notes?: string;
};

export type RsvpConfirmResponse = {
  ok: boolean;
  guest: string;
  faction?: FactionId | null;
};

// Loads guest profile from invitation token (public endpoint).
export async function fetchGuestByToken(token: string): Promise<GuestPublic> {
  const { data } = await apiClient.get<GuestPublic>(`/guest/${token}`);
  return data;
}

// Creates an invitation token for local admin/dev flows.
export async function createGuestInvitation(
  payload: GuestInvitationCreatePayload,
): Promise<GuestInvitationCreateResponse> {
  const { data } = await apiClient.post<GuestInvitationCreateResponse>(
    '/guest/create-invite',
    payload,
    { headers: withAdminHeaders() },
  );
  return data;
}

// Reads RSVP status for token before showing the form.
export async function fetchRsvpByToken(token: string): Promise<RsvpLookup> {
  const { data } = await apiClient.get<RsvpLookup>(`/rsvp/by-token/${token}`);
  return data;
}

// Submits RSVP confirmation (public endpoint).
export async function submitRsvpConfirmation(
  payload: RsvpConfirmPayload,
): Promise<RsvpConfirmResponse> {
  const { data } = await apiClient.post<RsvpConfirmResponse>('/rsvp/confirm', payload);
  return data;
}
