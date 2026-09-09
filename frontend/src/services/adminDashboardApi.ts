import { apiClient } from '@/services/apiClient';
import type { FactionId, IntoleranceId, MealChoiceId } from '@/services/rsvpApi';

export type AdminUserListItem = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  has_rsvp: boolean;
  attending?: boolean | null;
  faction?: string | null;
};

export type AdminRsvpStats = {
  total_users: number;
  total_confirmed: number;
  total_attending: number;
  total_not_attending: number;
  total_participants: number;
  total_children: number;
  by_faction: Record<string, number>;
  by_meal_choice: Partial<Record<MealChoiceId, number>>;
};

export type AdminRsvpGuestDetail = {
  first_name: string;
  last_name: string;
  meal_choice: MealChoiceId;
  intolerance: IntoleranceId;
  dietary_notes?: string | null;
  is_child: boolean;
};

export type AdminRsvpEntry = {
  user_id: number;
  rsvp_id: number;
  faction?: FactionId | null;
  has_special_diet: boolean;
  has_child: boolean;
  guest_count: number;
  account_holder: AdminRsvpGuestDetail;
  companions: AdminRsvpGuestDetail[];
  table_id?: number | null;
  table_label?: string | null;
};

export type AdminTable = {
  id: number;
  label: string;
  capacity: number;
  note?: string | null;
};

export type CreateTablePayload = {
  label: string;
  capacity: number;
  note?: string | null;
};

export type UpdateTablePayload = Partial<CreateTablePayload>;

export type AdminRsvpEntryFilter = 'all' | 'special_diet' | 'children';

export type AdminRsvpEntriesResponse = {
  items: AdminRsvpEntry[];
  total: number;
  page: number;
  page_size: number;
};

export type FetchAdminRsvpEntriesParams = {
  search?: string;
  filter?: AdminRsvpEntryFilter;
  page?: number;
  pageSize?: number;
};

// Loads admin user list for the dashboard.
export async function fetchAdminUserList(): Promise<AdminUserListItem[]> {
  const { data } = await apiClient.get<AdminUserListItem[]>('/admin/users');
  return data;
}

// Loads aggregate RSVP stats for the admin dashboard.
export async function fetchAdminRsvpStats(): Promise<AdminRsvpStats> {
  const { data } = await apiClient.get<AdminRsvpStats>('/admin/rsvp-stats');
  return data;
}

// Loads confirmed guests with full per-party detail — searchable, filterable, paginated server-side.
export async function fetchAdminRsvpEntries(
  params: FetchAdminRsvpEntriesParams = {},
): Promise<AdminRsvpEntriesResponse> {
  const { data } = await apiClient.get<AdminRsvpEntriesResponse>('/admin/rsvp-entries', {
    params: {
      search: params.search || undefined,
      filter: params.filter,
      page: params.page,
      page_size: params.pageSize,
    },
  });
  return data;
}

// Manually assigns (or clears, with null) the table for one party — picked
// from the admin-managed table catalog below, not typed free text.
export async function assignRsvpTable(rsvpId: number, tableId: number | null): Promise<number | null> {
  const { data } = await apiClient.patch<{ rsvp_id: number; table_id: number | null }>(
    `/admin/rsvp/${rsvpId}/table`,
    { table_id: tableId },
  );
  return data.table_id;
}

// Loads the full table catalog for the "Aggiungi al tavolo" dropdown and the
// Ripartizione Tavoli sidebar.
export async function fetchAdminTables(): Promise<AdminTable[]> {
  const { data } = await apiClient.get<AdminTable[]>('/admin/tables');
  return data;
}

export async function createAdminTable(payload: CreateTablePayload): Promise<AdminTable> {
  const { data } = await apiClient.post<AdminTable>('/admin/tables', payload);
  return data;
}

export async function updateAdminTable(tableId: number, payload: UpdateTablePayload): Promise<AdminTable> {
  const { data } = await apiClient.patch<AdminTable>(`/admin/tables/${tableId}`, payload);
  return data;
}

export async function deleteAdminTable(tableId: number): Promise<void> {
  await apiClient.delete(`/admin/tables/${tableId}`);
}
