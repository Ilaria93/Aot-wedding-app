import { describe, expect, it } from 'vitest';

import { shouldToggleCinematicDevHotkey } from '@/cinematic/debug/cinematicDevHotkey';

describe('shouldToggleCinematicDevHotkey', () => {
  it('matches case-insensitive hotkeys without modifiers', () => {
    expect(shouldToggleCinematicDevHotkey({ key: 'h' }, null, 'h')).toBe(true);
    expect(shouldToggleCinematicDevHotkey({ key: 'H' }, null, 'h')).toBe(true);
    expect(shouldToggleCinematicDevHotkey({ key: 'd' }, null, 'd')).toBe(true);
  });

  it('rejects mismatched keys and modified shortcuts', () => {
    expect(shouldToggleCinematicDevHotkey({ key: 'h' }, null, 'd')).toBe(false);
    expect(shouldToggleCinematicDevHotkey({ key: 'h', ctrlKey: true }, null, 'h')).toBe(false);
  });
});
