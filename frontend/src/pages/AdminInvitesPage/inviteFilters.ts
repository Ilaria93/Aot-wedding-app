import type { AdminInviteItem } from '@/services/adminInvitesApi';

export type InviteFilter = 'to_send' | 'waiting' | 'answered';

export const INVITE_FILTERS: InviteFilter[] = ['to_send', 'waiting', 'answered'];

const hasAnswer = (invite: AdminInviteItem) => invite.answer !== 'none' || invite.members.some((member) => member.answer !== 'none');

// Same rules as the backend's list_admin_invites filter; they never overlap.
const MATCHES: Record<InviteFilter, (invite: AdminInviteItem) => boolean> = {
  to_send: (invite) => invite.sent_at === null && !hasAnswer(invite),
  waiting: (invite) => invite.sent_at !== null && !hasAnswer(invite),
  answered: hasAnswer,
};

/** Invites as the couple counts them: one per shared group, one per person in an individual group. */
export const countInviteUnits = (invites: AdminInviteItem[]) =>
  invites.reduce((sum, invite) => sum + (invite.individual ? 1 + invite.members.length : 1), 0);

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
    waiting: invites.filter(MATCHES.waiting).length,
    answered: invites.filter(MATCHES.answered).length,
  };
}
