// Base URL for FastAPI.
// Production: always "/api" — Vercel forwards it to the backend (see vercel.json),
// so the browser only ever talks to the site's own address and the session
// cookies are first-party. Called straight at the backend's own domain they are
// third-party cookies, which Safari (iPhone/Mac) blocks outright and other
// browsers increasingly do, and login ends in "Missing access token".
// Development: VITE_API_URL from .env, else the local backend.
export const apiBaseUrl = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';
