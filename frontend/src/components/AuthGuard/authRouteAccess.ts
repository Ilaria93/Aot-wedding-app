const DEV_PUBLIC_PATHS = import.meta.env.DEV ? ['/dev/titan-preview'] : [];

const PUBLIC_PATHS = new Set([
  '/',
  '/invito',
  '/album',
  '/auth/login',
  '/auth/register',
  ...DEV_PUBLIC_PATHS,
]);
const ALWAYS_PROTECTED_PATHS = new Set(['/profile', '/admin', '/rsvp', '/travel']);

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

/** Whether an unauthenticated user must be sent to login for this path. */
export function requiresAuthentication(pathname: string, devUnlockAllRoutes: boolean) {
  if (ALWAYS_PROTECTED_PATHS.has(pathname)) {
    return true;
  }

  return !devUnlockAllRoutes && !isPublicPath(pathname);
}
