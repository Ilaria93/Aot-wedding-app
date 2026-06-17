const DEV_PUBLIC_PATHS = import.meta.env.DEV ? ['/dev/titan-preview'] : [];

const PUBLIC_PATHS = new Set([
  '/',
  '/album',
  '/travel',
  '/auth/login',
  '/auth/register',
  ...DEV_PUBLIC_PATHS,
]);
const PUBLIC_PREFIXES = ['/rsvp/'];
const ALWAYS_PROTECTED_PATHS = new Set(['/profile', '/admin']);

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Whether an unauthenticated user must be sent to login for this path. */
export function requiresAuthentication(pathname: string, devUnlockAllRoutes: boolean) {
  if (ALWAYS_PROTECTED_PATHS.has(pathname)) {
    return true;
  }

  return !devUnlockAllRoutes && !isPublicPath(pathname);
}
