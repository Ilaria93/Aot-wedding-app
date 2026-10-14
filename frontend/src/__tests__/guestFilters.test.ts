import { describe, expect, it } from 'vitest';

import { countGuests, guestsMatching } from '@/components/Rsvp/guestFilters';
import type { AdminRsvpEntry } from '@/services/adminDashboardApi';

const guest = (first_name: string, extra = {}) => ({ first_name, last_name: 'X', meal_choice: 'standard', intolerance: 'none', dietary_notes: null, is_child: false, ...extra });
const family = {
  account_holder: guest('Ilaria'),
  companions: [guest('Davide', { meal_choice: 'vegetarian' }), guest('Anna', { intolerance: 'eggs', is_child: true })],
} as unknown as AdminRsvpEntry;

describe('guest filters', () => {
  it('shows only the people the filter is about', () => {
    expect(guestsMatching(family, 'all').map((g) => g.first_name)).toEqual(['Ilaria', 'Davide', 'Anna']);
    expect(guestsMatching(family, 'special_diet').map((g) => g.first_name)).toEqual(['Davide', 'Anna']);
    expect(guestsMatching(family, 'children').map((g) => g.first_name)).toEqual(['Anna']);
  });

  it('counts people, not parties', () => {
    expect(countGuests([family, family])).toEqual({ all: 6, special_diet: 4, children: 2 });
  });
});
