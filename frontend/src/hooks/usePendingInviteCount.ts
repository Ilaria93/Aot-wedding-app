import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { INVITE_REQUESTS_CHANGED } from '@/pages/AdminInvitesPage/inviteFilters';
import { fetchPendingInviteCount } from '@/services/adminInvitesApi';

/**
 * Pending invite requests for the "Inviti" nav badge. Refetched on every
 * admin navigation and whenever the invites page approves or rejects one.
 * A failed load keeps the last value: the badge must never break the nav.
 */
export function usePendingInviteCount(enabled: boolean): number {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const load = () =>
      fetchPendingInviteCount()
        .then((value) => {
          if (active) setCount(value);
        })
        .catch(() => undefined);

    void load();
    window.addEventListener(INVITE_REQUESTS_CHANGED, load);
    return () => {
      active = false;
      window.removeEventListener(INVITE_REQUESTS_CHANGED, load);
    };
  }, [enabled, pathname]);

  return enabled ? count : 0;
}
