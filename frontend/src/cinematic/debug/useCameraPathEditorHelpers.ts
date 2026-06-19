import { useEffect, useState } from 'react';

import { shouldToggleCinematicDevHotkey } from '@/cinematic/debug/cinematicDevHotkey';

/**
 * Toggles camera path editor helpers with the "H" key (development only).
 */
export function useCameraPathEditorHelpers(enabled: boolean = __DEV__): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldToggleCinematicDevHotkey(event, event.target as HTMLElement | null, 'h')) {
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
