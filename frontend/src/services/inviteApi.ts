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

export type InviteRequestPayload = {
  first_name: string;
  last_name: string;
  phone: string;
  /** Honeypot: must stay empty; bots that fill every field get silently dropped. */
  website: string;
};

/**
 * Asks the couple for a personal invite (guests who lost or never got their
 * WhatsApp link). Public; the answer is the same whether or not the phone
 * already has an invite. Backend: see docs/superpowers/specs/2026-10-01-invite-requests-design.md.
 */
export async function requestInvite(payload: InviteRequestPayload): Promise<void> {
  await apiClient.post('/invite-requests', payload);
}
