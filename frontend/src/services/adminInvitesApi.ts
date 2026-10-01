import type { AxiosError } from 'axios';

import { apiClient } from '@/services/apiClient';

export type InviteAnswer = 'none' | 'attending' | 'declined';
export type Gender = 'm' | 'f';
export type Relation = 'spouse' | 'partner' | 'child' | 'other';
export type { GreetingKind } from '@/services/inviteApi';
import type { GreetingKind } from '@/services/inviteApi';

/** Someone linked to a head: rides on the head's invite, has no link of their own. */
export type InviteMember = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: Gender | null;
  relation: Relation;
};

/** A head: the person who receives the invite, with the people linked to them. */
export type AdminInviteItem = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: Gender | null;
  family_name: string | null;
  party_size: number | null;
  sent_at: string | null;
  answer: InviteAnswer;
  invite_url: string;
  /** Built by the backend with the personal message already written. */
  whatsapp_url: string;
  greeting_kind: GreetingKind;
  greeting_name: string;
  greeting_names: string[];
  /** False once sent: the group is locked, the invite can only be resent. */
  editable: boolean;
  members: InviteMember[];
};

export type InviteMatch = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  relation: Relation | null;
  head: { id: number; first_name: string; last_name: string; sent_at: string | null };
};

export type CreateInvitePayload = {
  first_name: string;
  last_name: string;
  gender: Gender | null;
  phone: string | null;
  /** Without head_id the person is a head and receives the invite. */
  head_id: number | null;
  relation: Relation | null;
  family_name: string | null;
  party_size: number | null;
};

export type UpdateInvitePayload = Partial<Omit<CreateInvitePayload, 'head_id'>>;

export type ImportReport = {
  created: number;
  skipped_duplicates: string[];
  errors: { row: number; reason: string }[];
};

// Every head with their group; the page filters and searches client-side (a wedding's worth of rows).
export async function fetchAdminInvites(): Promise<AdminInviteItem[]> {
  const { data } = await apiClient.get<AdminInviteItem[]>('/admin/invites');
  return data;
}

// People already in the table with this name or phone, members included.
export async function lookupInvites(params: {
  first_name: string;
  last_name: string;
  phone: string | null;
}): Promise<InviteMatch[]> {
  const { data } = await apiClient.get<InviteMatch[]>('/admin/invites/lookup', {
    params: { ...params, phone: params.phone || undefined },
  });
  return data;
}

export async function createInvite(payload: CreateInvitePayload, confirmDuplicate = false): Promise<AdminInviteItem> {
  const { data } = await apiClient.post<AdminInviteItem>('/admin/invites', payload, {
    params: confirmDuplicate ? { confirm_duplicate: true } : undefined,
  });
  return data;
}

export async function updateInvite(id: number, payload: UpdateInvitePayload): Promise<AdminInviteItem> {
  const { data } = await apiClient.patch<AdminInviteItem>(`/admin/invites/${id}`, payload);
  return data;
}

// Called right after the admin opens the WhatsApp link.
export async function markInviteSent(inviteId: number): Promise<AdminInviteItem> {
  const { data } = await apiClient.post<AdminInviteItem>(`/admin/invites/${inviteId}/mark-sent`);
  return data;
}

// The head's invite addressed to one person of the group (e.g. the spouse who asked for the link).
export async function fetchPersonWhatsappUrl(headId: number, personId: number): Promise<string> {
  const { data } = await apiClient.get<{ whatsapp_url: string }>(`/admin/invites/${headId}/whatsapp/${personId}`);
  return data.whatsapp_url;
}

export async function importInvitesCsv(file: File): Promise<ImportReport> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await apiClient.post<ImportReport>('/admin/invites/import', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Matches behind a 409 "already in the table" answer; empty for any other error. */
export function getDuplicateMatches(caughtError: unknown): InviteMatch[] {
  const detail = (caughtError as AxiosError<{ detail?: { code?: string; matches?: InviteMatch[] } }>).response?.data
    ?.detail;
  return detail && typeof detail === 'object' && detail.code === 'duplicate' ? (detail.matches ?? []) : [];
}

/** True for the 409 that says the head's invite was already sent. */
export function isLockedError(caughtError: unknown): boolean {
  const detail = (caughtError as AxiosError<{ detail?: { code?: string } }>).response?.data?.detail;
  return typeof detail === 'object' && detail?.code === 'locked';
}
