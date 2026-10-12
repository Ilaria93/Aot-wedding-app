import { useEffect, useState } from 'react';

import { subscribeToPendingRequests } from '@/services/apiClient';
import './styles/RequestSpinner.scss';

// Short calls finish before this and show nothing, so the spinner does not flicker on every tap.
const SHOW_AFTER_MS = 250;

/** A small spinning ring in the corner while the site is waiting for the server (saves, sends, slow wake-ups). */
export function RequestSpinner() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = subscribeToPendingRequests((count) => {
      window.clearTimeout(timer);
      if (count === 0) setBusy(false);
      else timer = window.setTimeout(() => setBusy(true), SHOW_AFTER_MS);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  return busy ? <span className="request-spinner" role="status" aria-label="Loading" /> : null;
}
