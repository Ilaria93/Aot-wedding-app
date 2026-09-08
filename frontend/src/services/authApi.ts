import { apiClient } from '@/services/apiClient';
import type { TranslateFn } from '@/i18n/translations';

export type UserRole = 'user' | 'admin';

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  // Optional: passwordless guest accounts created via an invite link have no email.
  email?: string | null;
  role: UserRole;
  created_at: string;
  last_login_at?: string | null;
};

export type LoginPayload = {
  secret: string;
  remember_me: boolean;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
};

export function isAdmin(role: UserRole | null | undefined): role is 'admin' {
  return role === 'admin';
}

export function formatUserRoleLabel(role: UserRole, t: TranslateFn): string {
  switch (role) {
    case 'admin':
      return t('common.roles.admin');
    default:
      return t('common.roles.user');
  }
}

// Unlocks the single shared admin account with the wedding passcode — the
// session cookies come back via Set-Cookie, not in the body. Guest accounts
// never call this, see services/guestAccessApi.ts instead.
export async function loginAccount(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/auth/login', payload);
  return data;
}

// Reads the currently authenticated user profile.
export async function fetchCurrentUserProfile(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

// Updates editable profile information for the logged-in user.
export async function updateCurrentUserProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>('/auth/me', payload);
  return data;
}
