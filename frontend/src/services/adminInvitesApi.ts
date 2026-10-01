import { apiClient } from '@/services/apiClient';

export type InviteRequestStatus = 'pending' | 'approved' | 'rejected';

export type InviteRequestItem = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  status: InviteRequestStatus;
  created_at: string;
  decided_at: string | null;
  invite_link_id: number | null;
  /** Set when this phone already has an invite: approving re-sends that one. */
  existing_invite: { id: number; first_name: string; last_name: string } | null;
};

export type InviteAnswer = 'none' | 'attending' | 'declined';

export type AdminInviteItem = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  sent_at: string | null;
  answer: InviteAnswer;
  invite_url: string;
  /** Built by the backend with the personal message already written. */
  whatsapp_url: string;
};

export type ApproveInviteResult = {
  invite_link_id: number;
  invite_url: string;
  whatsapp_url: string;
};

// Requests from the home "Non trovi il tuo invito?" dialog still awaiting a decision.
export async function fetchPendingInviteRequests(): Promise<InviteRequestItem[]> {
  const { data } = await apiClient.get<InviteRequestItem[]>('/admin/invite-requests', {
    params: { status: 'pending' },
  });
  return data;
}

// Number shown on the "Inviti" nav badge.
export async function fetchPendingInviteCount(): Promise<number> {
  const { data } = await apiClient.get<{ pending: number }>('/admin/invite-requests/pending-count');
  return data.pending;
}

export async function approveInviteRequest(requestId: number): Promise<ApproveInviteResult> {
  const { data } = await apiClient.post<ApproveInviteResult>(`/admin/invite-requests/${requestId}/approve`);
  return data;
}

export async function rejectInviteRequest(requestId: number): Promise<void> {
  await apiClient.post(`/admin/invite-requests/${requestId}/reject`);
}

// Every invite; the page filters and searches client-side (a wedding's worth of rows).
export async function fetchAdminInvites(): Promise<AdminInviteItem[]> {
  const { data } = await apiClient.get<AdminInviteItem[]>('/admin/invites');
  return data;
}

// Called right after the admin opens the WhatsApp link.
export async function markInviteSent(inviteId: number): Promise<AdminInviteItem> {
  const { data } = await apiClient.post<AdminInviteItem>(`/admin/invites/${inviteId}/mark-sent`);
  return data;
}
