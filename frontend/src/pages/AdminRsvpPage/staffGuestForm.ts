import type { StaffGuest, StaffGuestPayload } from '@/services/adminDashboardApi';
import type { IntoleranceId, MealChoiceId } from '@/services/rsvpApi';

export type StaffGuestFormValues = {
  name: string;
  role: string;
  mealChoice: MealChoiceId;
  intolerance: IntoleranceId;
  dietaryNotes: string;
  tableId: number | null;
};

export type StaffGuestFormField = 'name' | 'dietaryNotes';

export const EMPTY_STAFF_FORM: StaffGuestFormValues = {
  name: '',
  role: '',
  mealChoice: 'standard',
  intolerance: 'none',
  dietaryNotes: '',
  tableId: null,
};

// Adults only: the kids' menu is for guests.
export const STAFF_MEAL_CHOICES: MealChoiceId[] = ['standard', 'vegetarian', 'vegan', 'gluten_free'];
export const STAFF_INTOLERANCES: IntoleranceId[] = ['none', 'gluten', 'lactose', 'eggs', 'nuts', 'seafood', 'other'];

/** Same rule as the guests' RSVP: "other" needs a note saying what it is. */
export function validateStaffGuestForm(values: StaffGuestFormValues): Partial<Record<StaffGuestFormField, 'required'>> {
  const errors: Partial<Record<StaffGuestFormField, 'required'>> = {};
  if (!values.name.trim()) errors.name = 'required';
  if (values.intolerance === 'other' && !values.dietaryNotes.trim()) errors.dietaryNotes = 'required';
  return errors;
}

export function toStaffGuestPayload(values: StaffGuestFormValues): StaffGuestPayload {
  return {
    name: values.name.trim(),
    role: values.role.trim() || null,
    meal_choice: values.mealChoice,
    intolerance: values.intolerance,
    dietary_notes: values.dietaryNotes.trim() || null,
    table_id: values.tableId,
  };
}

export function staffGuestToForm(guest: StaffGuest): StaffGuestFormValues {
  return {
    name: guest.name,
    role: guest.role ?? '',
    mealChoice: guest.meal_choice,
    intolerance: guest.intolerance,
    dietaryNotes: guest.dietary_notes ?? '',
    tableId: guest.table_id,
  };
}
