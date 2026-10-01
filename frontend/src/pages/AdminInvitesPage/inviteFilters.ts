import type { AdminInviteItem } from '@/services/adminInvitesApi';

export type InviteFilter = 'to_send' | 'sent' | 'answered';

// Same rules as the backend's list_admin_invites filter.
const MATCHES: Record<InviteFilter, (invite: AdminInviteItem) => boolean> = {
  to_send: (invite) => invite.sent_at === null,
  sent: (invite) => invite.sent_at !== null,
  answered: (invite) => invite.answer !== 'none',
};

type Person = { first_name: string; last_name: string; phone: string | null };

function personMatches(person: Person, query: string): boolean {
  return (
    person.first_name.toLowerCase().includes(query) ||
    person.last_name.toLowerCase().includes(query) ||
    (person.phone ?? '').includes(query.replace(/\s/g, ''))
  );
}

// A search hit on anyone in the group shows the whole group (the head's card).
export function filterInvites(invites: AdminInviteItem[], filter: InviteFilter, search: string): AdminInviteItem[] {
  const query = search.trim().toLowerCase();
  return invites.filter(
    (invite) =>
      MATCHES[filter](invite) &&
      (!query || personMatches(invite, query) || invite.members.some((member) => personMatches(member, query))),
  );
}

export function countInvites(invites: AdminInviteItem[]): Record<InviteFilter, number> {
  return {
    to_send: invites.filter(MATCHES.to_send).length,
    sent: invites.filter(MATCHES.sent).length,
    answered: invites.filter(MATCHES.answered).length,
  };
}
