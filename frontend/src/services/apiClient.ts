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
