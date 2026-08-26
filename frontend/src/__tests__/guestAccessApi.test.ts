import { describe, expect, it } from 'vitest';

import { confirmGuestRsvp, requestGuestMagicLink, verifyGuestMagicLink } from '@/services/guestAccessApi';

describe('guestAccessApi', () => {
  it('exports the three guest-access functions', () => {
    expect(typeof confirmGuestRsvp).toBe('function');
    expect(typeof requestGuestMagicLink).toBe('function');
    expect(typeof verifyGuestMagicLink).toBe('function');
  });
});
