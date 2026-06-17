// Base URL for FastAPI; override via VITE_API_URL in .env.
export const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';
