import { useEffect, useState } from 'react';

import {
  getCountdownParts,
  type CountdownParts,
} from '@/constants/weddingEvent';

/**
 * Live wedding countdown parts, refreshed on a fixed interval.
 */
export function useWeddingCountdown(tickMs = 1000): CountdownParts {
  const [parts, setParts] = useState(() => getCountdownParts());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setParts(getCountdownParts());
    }, tickMs);

    return () => clearInterval(intervalId);
  }, [tickMs]);

  return parts;
}
