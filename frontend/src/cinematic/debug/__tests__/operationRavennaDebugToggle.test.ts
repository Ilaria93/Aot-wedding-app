import { describe, expect, it } from 'vitest';

import { shouldToggleOperationRavennaDebugOverlay } from '@/cinematic/debug/operationRavennaDebugToggle';

describe('shouldToggleOperationRavennaDebugOverlay', () => {
  it('accepts D key without modifiers', () => {
    expect(shouldToggleOperationRavennaDebugOverlay({ key: 'd' }, null)).toBe(true);
    expect(shouldToggleOperationRavennaDebugOverlay({ key: 'D' }, null)).toBe(true);
  });

  it('rejects other keys and modified shortcuts', () => {
    expect(shouldToggleOperationRavennaDebugOverlay({ key: 'h' }, null)).toBe(false);
    expect(shouldToggleOperationRavennaDebugOverlay({ key: 'd', metaKey: true }, null)).toBe(false);
  });

  it('ignores typing contexts', () => {
    expect(shouldToggleOperationRavennaDebugOverlay({ key: 'd' }, { tagName: 'INPUT' })).toBe(
      false,
    );
    expect(
      shouldToggleOperationRavennaDebugOverlay({ key: 'd' }, { tagName: 'DIV', isContentEditable: true }),
    ).toBe(false);
  });
});
