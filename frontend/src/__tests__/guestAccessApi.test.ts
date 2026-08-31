import { beforeEach, describe, expect, it, vi } from 'vitest';

import { confirmGuestRsvp, requestGuestMagicLink, verifyGuestMagicLink } from '@/services/guestAccessApi';

const post = vi.fn();
const get = vi.fn();

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
    get: (...args: unknown[]) => get(...args),
  },
}));

describe('guestAccessApi', () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it('posts the confirm payload to the token-scoped invite endpoint', async () => {
    post.mockResolvedValue({ data: { session: { access_token: 'abc' }, rsvp: { ok: true } } });

    const payload = {
      email: 'mario@example.com',
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

  it('posts the recovery request as an email body, not a query param', async () => {
    post.mockResolvedValue({ data: { ok: true } });

    await requestGuestMagicLink('mario@example.com');

    expect(post).toHaveBeenCalledWith('/auth/guest-magic-link/request', {
      email: 'mario@example.com',
    });
  });

  it('verifies a magic-link token via GET with the token as a param', async () => {
    get.mockResolvedValue({ data: { access_token: 'session-token' } });

    const session = await verifyGuestMagicLink('raw-magic-token');

    expect(get).toHaveBeenCalledWith('/auth/guest-magic-link/verify', {
      params: { token: 'raw-magic-token' },
    });
    expect(session.access_token).toBe('session-token');
  });
});
