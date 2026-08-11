import type { IntoleranceId, MealChoiceId } from '@/services/rsvpApi';

// The party-size limit used to be hardcoded here too. It's now read from the
// backend's /rsvp/me response (see RsvpMeResponse / useRsvpDraft) — the
// backend is the only place that enforces it, so it's the only place that
// declares it.

export const MEAL_CHOICE_IDS: MealChoiceId[] = [
  'standard',
  'vegetarian',
  'vegan',
  'gluten_free',
  'baby',
];

export const INTOLERANCE_IDS: IntoleranceId[] = [
  'none',
  'gluten',
  'lactose',
  'eggs',
  'nuts',
  'seafood',
  'other',
];
