import axios from 'axios';

import { adminApiKey, apiBaseUrl } from '@/constants/apiConfig';

// Shared HTTP client for all backend calls.
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attaches admin key when calling protected admin/dev endpoints.
export function withAdminHeaders() {
  return adminApiKey ? { 'X-Admin-Api-Key': adminApiKey } : {};
}
