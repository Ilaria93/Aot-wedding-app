import { apiClient } from '@/services/apiClient';

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
  by_faction: Record<string, number>;
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
