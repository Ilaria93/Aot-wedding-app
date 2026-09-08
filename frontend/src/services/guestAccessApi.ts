import { apiClient } from '@/services/apiClient';
import type { AuthUser } from '@/services/authApi';
import type { RsvpGuestLine, RsvpSubmitResponse } from '@/services/rsvpApi';

export type GuestRsvpConfirmPayload = {
  attending: boolean;
  guests: RsvpGuestLine[];
};

export type GuestRsvpConfirmResult = {
  user: AuthUser;
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
