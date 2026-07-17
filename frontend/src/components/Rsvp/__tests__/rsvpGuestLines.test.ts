import { describe, expect, it } from 'vitest';

import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
  guestLinesToDrafts,
} from '@/components/Rsvp/buildInitialGuestLines';
import { validateRsvpGuestLines } from '@/components/Rsvp/validateRsvpGuestLines';

describe('buildAccountHolderGuestLine', () => {
  it('prefills the registrant on the first row', () => {
    const guest = buildAccountHolderGuestLine({ first_name: 'Mario', last_name: 'Rossi' });

    expect(guest).toMatchObject({
      first_name: 'Mario',
      last_name: 'Rossi',
      isAccountHolder: true,
      meal_choice: 'standard',
      intolerance: 'none',
    });
  });
});

describe('guestLinesToDrafts', () => {
  it('locks row one to the account profile', () => {
    const drafts = guestLinesToDrafts(
      [
        {
          first_name: 'Altro',
          last_name: 'Nome',
          meal_choice: 'vegetarian',
          intolerance: 'none',
        },
      ],
      { first_name: 'Mario', last_name: 'Rossi' },
    );

    expect(drafts[0]).toMatchObject({
      first_name: 'Mario',
      last_name: 'Rossi',
      isAccountHolder: true,
      meal_choice: 'vegetarian',
    });
  });
});

describe('draftsToGuestPayload', () => {
  it('strips client-only fields and empty notes', () => {
    const payload = draftsToGuestPayload([
      {
        clientId: 'account-holder',
        first_name: ' Mario ',
        last_name: ' Rossi ',
        meal_choice: 'standard',
        intolerance: 'none',
        dietary_notes: '   ',
        isAccountHolder: true,
      },
    ]);

    expect(payload).toEqual([
      {
        first_name: 'Mario',
        last_name: 'Rossi',
        meal_choice: 'standard',
        intolerance: 'none',
      },
    ]);
  });
});

describe('validateRsvpGuestLines', () => {
  it('requires names for additional guests only', () => {
    const errors = validateRsvpGuestLines([
      buildAccountHolderGuestLine({ first_name: 'Mario', last_name: 'Rossi' }),
      {
        clientId: 'guest-2',
        first_name: '',
        last_name: '',
        meal_choice: 'standard',
        intolerance: 'none',
        dietary_notes: '',
        isAccountHolder: false,
      },
    ]);

    expect(errors.map((error) => error.field)).toEqual(['first_name', 'last_name']);
  });

  it('requires notes when intolerance is other', () => {
    const errors = validateRsvpGuestLines([
      {
        ...buildAccountHolderGuestLine({ first_name: 'Mario', last_name: 'Rossi' }),
        intolerance: 'other',
        dietary_notes: '',
      },
    ]);

    expect(errors).toEqual([
      expect.objectContaining({
        field: 'dietary_notes',
        messageKey: 'rsvp.validation.otherNotesRequired',
      }),
    ]);
  });
});
