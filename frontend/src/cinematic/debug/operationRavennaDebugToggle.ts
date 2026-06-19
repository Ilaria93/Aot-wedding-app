import { shouldToggleCinematicDevHotkey } from '@/cinematic/debug/cinematicDevHotkey';

export type DebugOverlayKeyEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
};

export type DebugOverlayKeyTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

/**
 * Returns whether a keyboard event should toggle the Operation Ravenna debug overlay.
 */
export function shouldToggleOperationRavennaDebugOverlay(
  event: DebugOverlayKeyEvent,
  target: DebugOverlayKeyTarget | null,
): boolean {
  return shouldToggleCinematicDevHotkey(event, target, 'd');
}
