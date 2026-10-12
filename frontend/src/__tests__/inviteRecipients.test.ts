import { describe, expect, it } from 'vitest';

import { inviteRecipients } from '@/pages/AdminInvitesPage/inviteRecipients';
import type { AdminInviteItem, InviteMember } from '@/services/adminInvitesApi';

const member = (id: number, first_name: string, phone: string | null): InviteMember => ({
  id,
  first_name,
  last_name: 'Rossi',
  phone,
  gender: null,
  relation: 'partner',
});

const invite = (overrides: Partial<AdminInviteItem>) => ({ id: 1, first_name: 'Marco', phone: '+393331111111', members: [], ...overrides }) as AdminInviteItem;

describe('inviteRecipients', () => {
  it('lists the head first, then the members, all with a phone', () => {
    const names = inviteRecipients(invite({ members: [member(2, 'Sara', '+393332222222')] })).map((r) => r.name);
    expect(names).toEqual(['Marco', 'Sara']);
  });

  it('skips people without a phone number', () => {
    expect(inviteRecipients(invite({ members: [member(2, 'Sara', null)] })).map((r) => r.name)).toEqual(['Marco']);
    expect(inviteRecipients(invite({ phone: null, members: [member(2, 'Sara', '+393332222222')] })).map((r) => r.name)).toEqual(['Sara']);
  });
});
