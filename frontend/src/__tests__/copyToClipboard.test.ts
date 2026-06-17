import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes text when clipboard API is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyToClipboard('iban-123')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('iban-123');
  });

  it('returns false when clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    await expect(copyToClipboard('iban-123')).resolves.toBe(false);
  });
});
