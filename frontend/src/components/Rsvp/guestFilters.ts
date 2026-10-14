import type { AdminRsvpEntry, AdminRsvpEntryFilter } from '@/services/adminDashboardApi';

type Guest = AdminRsvpEntry['account_holder'];

export const partyGuests = (entry: AdminRsvpEntry): Guest[] => [entry.account_holder, ...entry.companions];

// Same rule as the backend's special_diet filter, applied to one person.
const MATCHES: Record<AdminRsvpEntryFilter, (guest: Guest) => boolean> = {
  all: () => true,
  special_diet: (guest) => guest.intolerance !== 'none' || guest.meal_choice !== 'standard',
  children: (guest) => guest.is_child,
};

/** The people of a party the filter is about: all of them, only those with a special diet, or only the children. */
export const guestsMatching = (entry: AdminRsvpEntry, filter: AdminRsvpEntryFilter): Guest[] =>
  partyGuests(entry).filter(MATCHES[filter]);

/** How many people (not parties) each filter shows. */
export function countGuests(entries: AdminRsvpEntry[]): Record<AdminRsvpEntryFilter, number> {
  const count = (filter: AdminRsvpEntryFilter) => entries.reduce((sum, entry) => sum + guestsMatching(entry, filter).length, 0);
  return { all: count('all'), special_diet: count('special_diet'), children: count('children') };
}
