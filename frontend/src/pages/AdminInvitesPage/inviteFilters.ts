import type { AdminInviteItem } from '@/services/adminInvitesApi';

export type InviteFilter = 'to_send' | 'sent' | 'answered';

/** Window event the page fires after approve/reject so the nav badge refetches. */
export const INVITE_REQUESTS_CHANGED = 'invite-requests-changed';

// Same rules as the backend's list_admin_invites filter.
const MATCHES: Record<InviteFilter, (invite: AdminInviteItem) => boolean> = {
  to_send: (invite) => invite.sent_at === null,
  sent: (invite) => invite.sent_at !== null,
  answered: (invite) => invite.answer !== 'none',
};

export function filterInvites(invites: AdminInviteItem[], filter: InviteFilter, search: string): AdminInviteItem[] {
  const query = search.trim().toLowerCase();
  return invites.filter(
    (invite) =>
      MATCHES[filter](invite) &&
      (!query ||
        invite.first_name.toLowerCase().includes(query) ||
        invite.last_name.toLowerCase().includes(query) ||
        (invite.phone ?? '').includes(query)),
  );
}

export function countInvites(invites: AdminInviteItem[]): Record<InviteFilter, number> {
  return {
    to_send: invites.filter(MATCHES.to_send).length,
    sent: invites.filter(MATCHES.sent).length,
    answered: invites.filter(MATCHES.answered).length,
  };
}
