import type { AuthUser } from '@/services/authApi';

/**
 * Local QA: skip auth redirects and inject a mock admin session.
 * Set `EXPO_PUBLIC_DEV_UNLOCK_ROUTES=false` in `.env` to restore normal guards.
 */
export const DEV_UNLOCK_ALL_ROUTES =
  typeof __DEV__ !== 'undefined'
    ? __DEV__ && process.env.EXPO_PUBLIC_DEV_UNLOCK_ROUTES !== 'false'
    : process.env.EXPO_PUBLIC_DEV_UNLOCK_ROUTES === 'true';

/** Mock user used while {@link DEV_UNLOCK_ALL_ROUTES} is active. */
export const DEV_MOCK_AUTH_USER: AuthUser = {
  id: 0,
  first_name: 'Dev',
  last_name: 'Tester',
  email: 'dev@test.local',
  role: 'admin',
  created_at: '1970-01-01T00:00:00.000Z',
};
