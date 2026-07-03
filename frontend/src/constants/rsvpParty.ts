import type { IntoleranceId, MealChoiceId } from '@/services/rsvpApi';

export const MAX_PARTY_GUESTS = 10;

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
