import { apiClient } from '@/services/apiClient';
import type { AuthSessionResponse } from '@/services/authApi';
import type { RsvpGuestLine, RsvpSubmitResponse } from '@/services/rsvpApi';

export type GuestRsvpConfirmPayload = {
  email: string;
  attending: boolean;
  guests: RsvpGuestLine[];
};

export type GuestRsvpConfirmResult = {
  session: AuthSessionResponse;
  rsvp: RsvpSubmitResponse;
};

/** Confirms/updates an RSVP directly from the invite token — no prior session needed. */
export async function confirmGuestRsvp(
  token: string,
  payload: GuestRsvpConfirmPayload,
): Promise<GuestRsvpConfirmResult> {
  const { data } = await apiClient.post<GuestRsvpConfirmResult>(`/invites/${token}/rsvp`, payload);
  return data;
}

/** Requests a magic-link email for a guest who lost their WhatsApp invite link. */
export async function requestGuestMagicLink(email: string): Promise<void> {
  await apiClient.post('/auth/guest-magic-link/request', { email });
}

/** Exchanges a magic-link token (from the emailed URL) for a real session. */
export async function verifyGuestMagicLink(token: string): Promise<AuthSessionResponse> {
  const { data } = await apiClient.get<AuthSessionResponse>('/auth/guest-magic-link/verify', {
    params: { token },
  });
  return data;
}
