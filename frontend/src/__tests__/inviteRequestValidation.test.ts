import { describe, expect, it } from 'vitest';

import { validateInviteRequest } from '@/components/Landing/InviteRequestDialog';

const valid = { firstName: 'Mario', lastName: 'Rossi', phone: '+39 333 1234567' };

describe('validateInviteRequest', () => {
  it('accepts a complete request', () => {
    expect(validateInviteRequest(valid)).toEqual({});
  });

  it('requires first and last name', () => {
    expect(validateInviteRequest({ ...valid, firstName: '  ', lastName: '' })).toEqual({
      firstName: 'required',
      lastName: 'required',
    });
  });

  it('rejects the bare default prefix and too-short numbers', () => {
    expect(validateInviteRequest({ ...valid, phone: '+39 ' }).phone).toBe('phoneInvalid');
    expect(validateInviteRequest({ ...valid, phone: '+39 12' }).phone).toBe('phoneInvalid');
  });

  it('rejects letters and over-long numbers', () => {
    expect(validateInviteRequest({ ...valid, phone: '333 abc 4567' }).phone).toBe('phoneInvalid');
    expect(validateInviteRequest({ ...valid, phone: '+39 3331234567890123' }).phone).toBe('phoneInvalid');
  });

  it('accepts common Italian formats', () => {
    expect(validateInviteRequest({ ...valid, phone: '3331234567' })).toEqual({});
    expect(validateInviteRequest({ ...valid, phone: '+39 (333) 123-4567' })).toEqual({});
  });
});
