import axios from 'axios';

import { apiBaseUrl } from '@/constants/apiConfig';
import { refreshAccessToken } from '@/services/authSession';

// Shared HTTP client for all backend calls. Auth tokens ride in httpOnly
// cookies (withCredentials sends/receives them automatically) — no header to
// attach here.
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// How many calls are in flight, for the spinner (components/RequestSpinner). Registered before the refresh
// interceptor below so a retried call is counted once per attempt.
let pending = 0;
const listeners = new Set<(count: number) => void>();
const track = (delta: number) => {
  pending = Math.max(0, pending + delta);
  listeners.forEach((listener) => listener(pending));
};
export function subscribeToPendingRequests(listener: (count: number) => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
apiClient.interceptors.request.use((config) => (track(1), config));
apiClient.interceptors.response.use(
  (response) => (track(-1), response),
  (error) => (track(-1), Promise.reject(error)),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      return Promise.reject(error);
    }

    return apiClient(originalRequest);
  },
);
