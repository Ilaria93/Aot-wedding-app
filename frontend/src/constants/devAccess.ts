import type { AuthUser } from '@/services/authApi';

/** When true, protected routes stay accessible without login during local preview. */
export const DEV_UNLOCK_ALL_ROUTES =
  import.meta.env.VITE_DEV_UNLOCK_ROUTES !== 'false' && import.meta.env.DEV;

/** Mock user used while {@link DEV_UNLOCK_ALL_ROUTES} is active. */
export const DEV_MOCK_AUTH_USER: AuthUser = {
  id: 0,
  first_name: 'Dev',
  last_name: 'Tester',
  email: 'dev@test.local',
  role: 'admin',
  created_at: '1970-01-01T00:00:00.000Z',
};
