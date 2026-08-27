const DEV_PUBLIC_PATHS = import.meta.env.DEV ? ['/dev/titan-preview', '/dev/star-crawl'] : [];

const PUBLIC_PATHS = new Set([
  '/',
  '/album',
  '/travel',
  '/auth/login',
  '/auth/register',
  ...DEV_PUBLIC_PATHS,
]);
// Prefix, not exact match: the token segment is different for every guest link.
const PUBLIC_PATH_PREFIXES = ['/invito/'];
const ALWAYS_PROTECTED_PATHS = new Set(['/profile', '/admin', '/rsvp']);

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Whether an unauthenticated user must be sent to login for this path. */
export function requiresAuthentication(pathname: string, devUnlockAllRoutes: boolean) {
  if (ALWAYS_PROTECTED_PATHS.has(pathname)) {
    return true;
  }

  return !devUnlockAllRoutes && !isPublicPath(pathname);
}
