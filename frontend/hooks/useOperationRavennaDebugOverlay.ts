import { useEffect, useState } from 'react';

import { shouldToggleOperationRavennaDebugOverlay } from '@/utils/operationRavennaDebugToggle';

/**
 * Toggles Operation Ravenna debug overlay visibility with the "D" key (development only).
 */
export function useOperationRavennaDebugOverlay(enabled: boolean = __DEV__): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldToggleOperationRavennaDebugOverlay(event, event.target as HTMLElement | null)) {
        return;
      }

      event.preventDefault();
      setVisible((current) => !current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return visible;
}
