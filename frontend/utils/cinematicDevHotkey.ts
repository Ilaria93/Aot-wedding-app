export type CinematicDevHotkeyEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
};

export type CinematicDevHotkeyTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

/**
 * Returns whether a keyboard event should toggle a cinematic development overlay.
 */
export function shouldToggleCinematicDevHotkey(
  event: CinematicDevHotkeyEvent,
  target: CinematicDevHotkeyTarget | null,
  hotkey: string,
): boolean {
  const normalizedHotkey = hotkey.toLowerCase();
  const normalizedEventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (normalizedEventKey !== normalizedHotkey) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  if (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable
  ) {
    return false;
  }

  return true;
}
