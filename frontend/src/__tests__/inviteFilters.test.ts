import { describe, expect, it } from 'vitest';

import { countInvites, filterInvites } from '@/pages/AdminInvitesPage/inviteFilters';
import type { AdminInviteItem } from '@/services/adminInvitesApi';

function invite(overrides: Partial<AdminInviteItem>): AdminInviteItem {
  return {
    id: 1,
    first_name: 'Mario',
    last_name: 'Rossi',
    phone: '+393331234567',
    sent_at: null,
    answer: 'none',
    invite_url: 'https://site/invito/t',
    whatsapp_url: 'https://wa.me/393331234567?text=x',
    ...overrides,
  };
}

const notSent = invite({ id: 1 });
const sentNoAnswer = invite({ id: 2, first_name: 'Luca', sent_at: '2026-10-01T10:00:00' });
const sentAttending = invite({ id: 3, first_name: 'Anna', last_name: 'Bianchi', sent_at: '2026-10-01T10:00:00', answer: 'attending' });
const noPhone = invite({ id: 4, first_name: 'Zia', phone: null });
const all = [notSent, sentNoAnswer, sentAttending, noPhone];

describe('filterInvites', () => {
  it('to_send keeps invites never sent', () => {
    expect(filterInvites(all, 'to_send', '').map((i) => i.id)).toEqual([1, 4]);
  });

  it('sent keeps invites with sent_at', () => {
    expect(filterInvites(all, 'sent', '').map((i) => i.id)).toEqual([2, 3]);
  });

  it('answered keeps invites with any answer', () => {
    expect(filterInvites(all, 'answered', '').map((i) => i.id)).toEqual([3]);
  });

  it('searches first name, last name and phone, case-insensitively and trimmed', () => {
    expect(filterInvites(all, 'sent', '  bianchi ').map((i) => i.id)).toEqual([3]);
    expect(filterInvites(all, 'to_send', '3331234').map((i) => i.id)).toEqual([1]);
    expect(filterInvites(all, 'to_send', 'ZIA').map((i) => i.id)).toEqual([4]);
  });
});

describe('countInvites', () => {
  it('counts each filter on the unsearched list', () => {
    expect(countInvites(all)).toEqual({ to_send: 2, sent: 2, answered: 1 });
  });
});
