import { apiClient } from '@/services/apiClient';

export type InviteLink = {
  first_name: string;
  last_name: string;
};

/** Reads the guest name behind a WhatsApp invite token. Public endpoint, no auth. */
export async function fetchInviteByToken(token: string): Promise<InviteLink> {
  const { data } = await apiClient.get<InviteLink>(`/invites/${token}`);
  return data;
}
