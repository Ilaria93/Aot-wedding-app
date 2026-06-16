/**
 * Native fallback — reduced-motion preference is not queried on mobile stubs.
 */
export function usePrefersReducedMotion(): boolean {
  return false;
}
