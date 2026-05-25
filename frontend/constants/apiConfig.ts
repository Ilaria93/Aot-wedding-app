// Base URL for FastAPI; override via EXPO_PUBLIC_API_URL in .env.
export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

export const adminApiKey = process.env.EXPO_PUBLIC_ADMIN_API_KEY || '';
