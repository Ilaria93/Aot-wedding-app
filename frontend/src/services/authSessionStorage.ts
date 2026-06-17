export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

const AUTH_SESSION_STORAGE_KEY = 'aot-wedding-auth-session';

/** Persists auth tokens in localStorage for the web app. */
export async function persistAuthSession(session: StoredAuthSession): Promise<void> {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

/** Reads a previously stored auth session if the user chose to stay connected. */
export async function readStoredAuthSession(): Promise<StoredAuthSession | null> {
  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredAuthSession;
  } catch {
    return null;
  }
}

/** Clears persisted tokens when the user logs out or the session becomes invalid. */
export async function clearStoredAuthSession(): Promise<void> {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
