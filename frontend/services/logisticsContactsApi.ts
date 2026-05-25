import { apiClient } from '@/services/apiClient';

export type LogisticsContactCategory =
  | 'hair'
  | 'makeup'
  | 'laundry'
  | 'hotel'
  | 'transfer'
  | 'car_rental';

export type LogisticsContactItem = {
  id: number;
  category: LogisticsContactCategory;
  label: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type LogisticsContactPayload = {
  category: LogisticsContactCategory;
  label: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  notes?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type LogisticsContactUpdatePayload = Partial<LogisticsContactPayload>;

// Loads the public guest-facing travel contacts directory.
export async function fetchPublicLogisticsContacts(): Promise<LogisticsContactItem[]> {
  const { data } = await apiClient.get<LogisticsContactItem[]>('/contacts');
  return data;
}

// Loads every logistics contact for the admin dashboard.
export async function fetchAdminLogisticsContacts(): Promise<LogisticsContactItem[]> {
  const { data } = await apiClient.get<LogisticsContactItem[]>('/admin/contacts');
  return data;
}

// Creates one admin-managed logistics entry.
export async function createAdminLogisticsContact(
  payload: LogisticsContactPayload,
): Promise<LogisticsContactItem> {
  const { data } = await apiClient.post<LogisticsContactItem>('/admin/contacts', payload);
  return data;
}

// Updates one logistics entry without replacing the full object.
export async function updateAdminLogisticsContact(
  contactId: number,
  payload: LogisticsContactUpdatePayload,
): Promise<LogisticsContactItem> {
  const { data } = await apiClient.patch<LogisticsContactItem>(`/admin/contacts/${contactId}`, payload);
  return data;
}

// Deletes one logistics entry from the admin dashboard.
export async function deleteAdminLogisticsContact(contactId: number): Promise<void> {
  await apiClient.delete(`/admin/contacts/${contactId}`);
}
