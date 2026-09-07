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
  email: string;
  password: string;
  remember_me: boolean;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
};

export type AuthSessionResponse = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  access_token_expires_in_seconds: number;
  refresh_token_expires_in_seconds: number;
  remember_me: boolean;
  user: AuthUser;
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

// Logs in an admin user and returns fresh tokens. Guest accounts have no
// password — they never call this, see services/guestAccessApi.ts instead.
export async function loginAccount(payload: LoginPayload): Promise<AuthSessionResponse> {
  const { data } = await apiClient.post<AuthSessionResponse>('/auth/login', payload);
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

// Requests a set/reset-password email. Always resolves — the backend never
// reveals whether the address matched an account.
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/password-reset/request', { email });
}

// Sets a new password from a valid reset-link token.
export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/password-reset/confirm', { token, new_password: newPassword });
}
