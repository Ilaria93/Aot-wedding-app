import axios from 'axios';

import { apiBaseUrl } from '@/constants/apiConfig';
import {
  clearStoredAuthSession,
  persistAuthSession,
  readStoredAuthSession,
  type StoredAuthSession,
} from '@/services/authSessionStorage';

let currentSession: StoredAuthSession | null = null;
let refreshPromise: Promise<string | null> | null = null;
const sessionListeners = new Set<(session: StoredAuthSession | null) => void>();

const authRefreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener(currentSession));
}

// Returns the in-memory access token used by authenticated API requests.
export function getAccessToken(): string | null {
  return currentSession?.accessToken || null;
}

// Returns the in-memory refresh token used for token rotation.
export function getRefreshToken(): string | null {
  return currentSession?.refreshToken || null;
}

// Returns the full current auth session, if one is active.
export function getCurrentSession(): StoredAuthSession | null {
  return currentSession;
}

// Updates the in-memory auth session and optionally persists it.
export async function setCurrentSession(session: StoredAuthSession | null): Promise<void> {
  currentSession = session;

  if (session && session.rememberMe) {
    await persistAuthSession(session);
  } else {
    await clearStoredAuthSession();
  }

  notifySessionListeners();
}

// Clears both memory and persisted storage for the current session.
export async function clearCurrentSession(): Promise<void> {
  currentSession = null;
  await clearStoredAuthSession();
  notifySessionListeners();
}

// Restores a remembered session into memory on app startup.
export async function restoreRememberedSession(): Promise<StoredAuthSession | null> {
  const storedSession = await readStoredAuthSession();
  currentSession = storedSession;
  notifySessionListeners();
  return storedSession;
}

// Lets React context stay in sync when the session changes outside component state.
export function subscribeToSessionChanges(listener: (session: StoredAuthSession | null) => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

// Rotates the access token using the current refresh token, if available.
export async function refreshAccessToken(): Promise<string | null> {
  if (!currentSession?.refreshToken) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authRefreshClient
    .post('/auth/refresh', {
      refresh_token: currentSession.refreshToken,
    })
    .then(async ({ data }) => {
      const refreshedSession: StoredAuthSession = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        rememberMe: data.remember_me,
      };
      await setCurrentSession(refreshedSession);
      return refreshedSession.accessToken;
    })
    .catch(async () => {
      await clearCurrentSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Logs out the current session on the backend and clears local state.
export async function logoutCurrentSession(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await authRefreshClient.post('/auth/logout', {
        refresh_token: refreshToken,
      });
    }
  } catch {
    // Logout stays idempotent even if the backend call fails (offline, already-revoked token, etc.).
  } finally {
    await clearCurrentSession();
  }
}
