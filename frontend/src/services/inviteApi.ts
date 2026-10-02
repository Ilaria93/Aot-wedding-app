import { apiClient } from '@/services/apiClient';
import type { RsvpMe } from '@/services/rsvpApi';

export type GreetingKind = 'family' | 'couple' | 'single_m' | 'single_f' | 'single';

export type InviteLink = {
  first_name: string;
  last_name: string;
  /** Computed from the group by the server: which greeting, and for whom. */
  greeting_kind: GreetingKind;
  greeting_name: string;
  greeting_names: string[];
  min_party_guests: number;
  max_party_guests: number;
};

/** Reads the guest name behind a WhatsApp invite token. Public endpoint, no auth. */
export async function fetchInviteByToken(token: string): Promise<InviteLink> {
  const { data } = await apiClient.get<InviteLink>(`/invites/${token}`);
  return data;
}

/**
 * The answer this invite already gave, or null if none yet. Public: the token
 * is the only credential, same as for the invite itself.
 */
export async function fetchInviteRsvp(token: string): Promise<RsvpMe | null> {
  const { data } = await apiClient.get<RsvpMe | null>(`/invites/${token}/rsvp`);
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
