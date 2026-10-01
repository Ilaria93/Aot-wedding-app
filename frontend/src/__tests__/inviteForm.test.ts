import { describe, expect, it } from 'vitest';

import {
  EMPTY_INVITE_FORM,
  buildCreatePayload,
  parseAddParams,
  validateInviteForm,
  type InviteFormValues,
} from '@/pages/AdminInvitesPage/inviteForm';

const head: InviteFormValues = { ...EMPTY_INVITE_FORM, firstName: 'Christian', lastName: 'Rossi' };

describe('validateInviteForm', () => {
  it('needs a first and last name', () => {
    expect(validateInviteForm(EMPTY_INVITE_FORM)).toEqual({ firstName: 'required', lastName: 'required' });
    expect(validateInviteForm(head)).toEqual({});
  });

  it('phone is optional but must look like a phone when present', () => {
    expect(validateInviteForm({ ...head, phone: '' })).toEqual({});
    expect(validateInviteForm({ ...head, phone: '+39 333 1234567' })).toEqual({});
    expect(validateInviteForm({ ...head, phone: 'abc' })).toEqual({ phone: 'phoneInvalid' });
    expect(validateInviteForm({ ...head, phone: '123' })).toEqual({ phone: 'phoneInvalid' });
  });

  it('a linked person needs a head and a relation', () => {
    const member: InviteFormValues = { ...head, role: 'member' };
    expect(validateInviteForm(member)).toEqual({ headId: 'required', relation: 'required' });
    expect(validateInviteForm({ ...member, headId: 3, relation: 'spouse' })).toEqual({});
  });

  it('party size is a positive whole number on a head', () => {
    expect(validateInviteForm({ ...head, partySize: '5' })).toEqual({});
    expect(validateInviteForm({ ...head, partySize: '0' })).toEqual({ partySize: 'partySizeInvalid' });
    expect(validateInviteForm({ ...head, partySize: '2.5' })).toEqual({ partySize: 'partySizeInvalid' });
  });
});

describe('buildCreatePayload', () => {
  it('builds a head with trimmed values and nulls for blanks', () => {
    expect(
      buildCreatePayload({ ...head, firstName: ' Christian ', gender: 'm', familyName: ' Rossi ', partySize: '5' }),
    ).toEqual({
      first_name: 'Christian',
      last_name: 'Rossi',
      gender: 'm',
      phone: null,
      head_id: null,
      relation: null,
      family_name: 'Rossi',
      party_size: 5,
    });
  });

  it('a linked person carries head and relation, never family name or party size', () => {
    expect(
      buildCreatePayload({
        ...head,
        firstName: 'Arianna',
        role: 'member',
        headId: 3,
        relation: 'spouse',
        familyName: 'ignored',
        partySize: '9',
      }),
    ).toMatchObject({ head_id: 3, relation: 'spouse', family_name: null, party_size: null });
  });
});

describe('parseAddParams', () => {
  it('reads the prefill of a Telegram link', () => {
    expect(parseAddParams('?add=1&first_name=Mario&last_name=Rossi&phone=%2B393331234567')).toEqual({
      firstName: 'Mario',
      lastName: 'Rossi',
      phone: '+393331234567',
    });
  });

  it('ignores links that are not an add link or carry no name', () => {
    expect(parseAddParams('')).toBeNull();
    expect(parseAddParams('?first_name=Mario')).toBeNull();
    expect(parseAddParams('?add=1&phone=%2B39333')).toBeNull();
  });
});
