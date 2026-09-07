import { apiClient } from '@/services/apiClient';

export type InviteLink = {
  first_name: string;
  last_name: string;
  min_party_guests: number;
  max_party_guests: number;
};

/** Reads the guest name behind a WhatsApp invite token. Public endpoint, no auth. */
export async function fetchInviteByToken(token: string): Promise<InviteLink> {
  const { data } = await apiClient.get<InviteLink>(`/invites/${token}`);
  return data;
}
