import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

const AUTH_SESSION_STORAGE_KEY = 'aot-wedding-auth-session';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Persists auth tokens securely on native and in localStorage on web.
export async function persistAuthSession(session: StoredAuthSession): Promise<void> {
  const serializedSession = JSON.stringify(session);

  if (Platform.OS === 'web' && canUseLocalStorage()) {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, serializedSession);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, serializedSession);
}

// Reads a previously stored auth session if the user chose to stay connected.
export async function readStoredAuthSession(): Promise<StoredAuthSession | null> {
  const rawSession =
    Platform.OS === 'web' && canUseLocalStorage()
      ? window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
      : await SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredAuthSession;
  } catch {
    return null;
  }
}

// Clears persisted tokens when the user logs out or the session becomes invalid.
export async function clearStoredAuthSession(): Promise<void> {
  if (Platform.OS === 'web' && canUseLocalStorage()) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}
