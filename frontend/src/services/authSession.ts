import axios from 'axios';

import { apiBaseUrl } from '@/constants/apiConfig';

let refreshPromise: Promise<boolean> | null = null;

const authRefreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tokens live in httpOnly cookies now — there's nothing for JS to read or
// pass, just the browser's cookie jar and the outcome of each call.

// Rotates the session cookies using the refresh-token cookie already on the
// browser. Concurrent callers share one in-flight request.
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authRefreshClient
    .post('/auth/refresh')
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Revokes the current refresh session on the backend and clears the cookies.
export async function logoutCurrentSession(): Promise<void> {
  try {
    await authRefreshClient.post('/auth/logout');
  } catch {
    // Logout stays idempotent even if the backend call fails (offline, already-revoked session, etc.).
  }
}
