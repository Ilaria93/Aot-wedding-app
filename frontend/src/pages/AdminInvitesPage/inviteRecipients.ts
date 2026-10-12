import type { AdminInviteItem, InviteMember } from '@/services/adminInvitesApi';

export type InviteRecipient =
  | { kind: 'head'; name: string }
  | { kind: 'member'; name: string; member: InviteMember };

/** Everyone in the group with a phone number, the head first: who "send to all" goes through, one tap each. */
export function inviteRecipients(invite: AdminInviteItem): InviteRecipient[] {
  const head: InviteRecipient[] = invite.phone ? [{ kind: 'head', name: invite.first_name }] : [];
  const members: InviteRecipient[] = invite.members
    .filter((member) => member.phone)
    .map((member) => ({ kind: 'member', name: member.first_name, member }));
  return [...head, ...members];
}
