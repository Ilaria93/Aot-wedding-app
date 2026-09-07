import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmGuestRsvp } from '@/services/guestAccessApi';

const post = vi.fn();

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
  },
}));

describe('guestAccessApi', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('posts the confirm payload to the token-scoped invite endpoint, with no email field', async () => {
    post.mockResolvedValue({ data: { session: { access_token: 'abc' }, rsvp: { ok: true } } });

    const payload = {
      attending: true,
      guests: [
        {
          first_name: 'Mario',
          last_name: 'Rossi',
          meal_choice: 'standard' as const,
          intolerance: 'none' as const,
        },
      ],
    };
    const result = await confirmGuestRsvp('party-token-abc', payload);

    expect(post).toHaveBeenCalledWith('/invites/party-token-abc/rsvp', payload);
    expect(result.session.access_token).toBe('abc');
  });
});
