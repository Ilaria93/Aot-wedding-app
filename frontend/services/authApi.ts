import { apiClient } from '@/services/apiClient';

export type UserRole = 'invited' | 'admin';

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login_at?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember_me: boolean;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
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

// Registers a new user and returns the initial session.
export async function registerAccount(payload: RegisterPayload): Promise<AuthSessionResponse> {
  const { data } = await apiClient.post<AuthSessionResponse>('/auth/register', payload);
  return data;
}

// Logs in an existing user and returns fresh tokens.
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
