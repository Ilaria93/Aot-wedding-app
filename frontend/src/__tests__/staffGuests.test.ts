import { describe, expect, it } from 'vitest';

import { computeTableUsage } from '@/pages/AdminRsvpPage/AdminRsvpPage';
import {
  EMPTY_STAFF_FORM,
  staffGuestToForm,
  toStaffGuestPayload,
  validateStaffGuestForm,
} from '@/pages/AdminRsvpPage/staffGuestForm';
import type { AdminRsvpEntry, AdminTable, StaffGuest } from '@/services/adminDashboardApi';

const tables: AdminTable[] = [
  { id: 1, label: 'Tavolo 1', capacity: 10 },
  { id: 2, label: 'Tavolo 2', capacity: 8 },
];

const guest = (first: string) => ({ first_name: first, last_name: 'R', meal_choice: 'standard', intolerance: 'none', is_child: false });

function entry(tableId: number | null, companions = 0): AdminRsvpEntry {
  return {
    user_id: 1,
    rsvp_id: 1,
    has_special_diet: false,
    has_child: false,
    guest_count: 1 + companions,
    account_holder: guest('A'),
    companions: Array.from({ length: companions }, (_, index) => guest(`C${index}`)),
    table_id: tableId,
  } as unknown as AdminRsvpEntry;
}

describe('computeTableUsage', () => {
  it('counts the staff at their table next to the guests', () => {
    const usage = computeTableUsage(tables, [entry(1, 2)], [{ table_id: 1 }, { table_id: 2 }]);
    expect(usage.tables.map((table) => table.assignedCount)).toEqual([4, 1]);
    expect(usage.unassignedCount).toBe(0);
  });

  it('counts staff without a table as unassigned', () => {
    const usage = computeTableUsage(tables, [entry(null)], [{ table_id: null }, { table_id: null }]);
    expect(usage.unassignedCount).toBe(3);
  });

  it('works without staff', () => {
    expect(computeTableUsage(tables, [entry(2)]).tables.map((table) => table.assignedCount)).toEqual([0, 1]);
  });
});

describe('staff guest form', () => {
  it('needs a name', () => {
    expect(validateStaffGuestForm(EMPTY_STAFF_FORM)).toEqual({ name: 'required' });
    expect(validateStaffGuestForm({ ...EMPTY_STAFF_FORM, name: 'Marco' })).toEqual({});
  });

  it('"other" intolerance needs a note, like for guests', () => {
    const values = { ...EMPTY_STAFF_FORM, name: 'Marco', intolerance: 'other' as const };
    expect(validateStaffGuestForm(values)).toEqual({ dietaryNotes: 'required' });
    expect(validateStaffGuestForm({ ...values, dietaryNotes: 'sedano' })).toEqual({});
  });

  it('builds a trimmed payload and round-trips an existing person', () => {
    const payload = toStaffGuestPayload({
      ...EMPTY_STAFF_FORM,
      name: ' Marco ',
      role: ' Fotografo ',
      mealChoice: 'vegetarian',
      tableId: 2,
    });
    expect(payload).toEqual({
      name: 'Marco',
      role: 'Fotografo',
      meal_choice: 'vegetarian',
      intolerance: 'none',
      dietary_notes: null,
      table_id: 2,
    });
    const saved: StaffGuest = { id: 5, table_label: 'Tavolo 2', ...payload };
    expect(toStaffGuestPayload(staffGuestToForm(saved))).toEqual(payload);
  });
});
