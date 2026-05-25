import { apiClient } from '@/services/apiClient';

export type AdminGuestListItem = {
  id: number;
  full_name: string;
  invitation_token: string;
  has_rsvp: boolean;
  attending?: boolean | null;
  faction?: string | null;
};

export type AdminRsvpStats = {
  total_invited: number;
  total_confirmed: number;
  total_attending: number;
  total_not_attending: number;
  by_faction: Record<string, number>;
};

// Loads admin guest list for the local dashboard.
export async function fetchAdminGuestList(): Promise<AdminGuestListItem[]> {
  const { data } = await apiClient.get<AdminGuestListItem[]>('/admin/guests');
  return data;
}

// Loads aggregate RSVP stats for the local admin dashboard.
export async function fetchAdminRsvpStats(): Promise<AdminRsvpStats> {
  const { data } = await apiClient.get<AdminRsvpStats>('/admin/rsvp-stats');
  return data;
}
