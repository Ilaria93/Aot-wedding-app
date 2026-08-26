import { describe, expect, it } from 'vitest';

import { mapGuestRsvpErrorToMessageKey } from '@/pages/GuestRsvpPage/mapGuestRsvpError';

describe('mapGuestRsvpErrorToMessageKey', () => {
  it('maps a 403 (deadline closed) to the deadline copy key', () => {
    expect(mapGuestRsvpErrorToMessageKey(403)).toBe('rsvp.deadlineClosedError');
  });

  it('maps a 404 (unknown invite token) to the invite-not-found copy key', () => {
    expect(mapGuestRsvpErrorToMessageKey(404)).toBe('invite.notFoundBody');
  });

  it('maps anything else, including undefined, to the generic submit-error key', () => {
    expect(mapGuestRsvpErrorToMessageKey(500)).toBe('rsvp.submitError');
    expect(mapGuestRsvpErrorToMessageKey(undefined)).toBe('rsvp.submitError');
  });
});
