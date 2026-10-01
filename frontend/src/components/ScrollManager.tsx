import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scroll offset per history entry, so Back returns where the guest left off.
const positions = new Map<string, number>();

/**
 * BrowserRouter has no scroll handling: a link kept the old page's offset and
 * Back didn't restore it. New pages start at the top (unless a #hash points
 * somewhere, which the page scrolls to itself); Back/Forward restore.
 */
export function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKey = useRef(location.key);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    // Tracked continuously: by the time the route changes, the new page is
    // already in the DOM and scrollY may have been clamped to its height.
    const save = () => positions.set(currentKey.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  useLayoutEffect(() => {
    currentKey.current = location.key;
    const saved = positions.get(location.key);
    if (navigationType === 'POP' && saved !== undefined) {
      window.scrollTo({ top: saved, behavior: 'instant' });
    } else if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.key, location.hash, navigationType]);

  return null;
}
