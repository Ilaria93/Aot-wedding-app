import { describe, expect, it } from 'vitest';

import { shouldShowPlaceholders } from '@/pages/AdminGalleryPage/AdminGalleryPage';

describe('shouldShowPlaceholders', () => {
  it('shows skeletons while a page is being fetched, even if photos are already known', () => {
    expect(shouldShowPlaceholders(true, 3)).toBe(true);
  });

  it('shows skeletons once a fetch confirms the grid is genuinely empty', () => {
    expect(shouldShowPlaceholders(false, 0)).toBe(true);
  });

  it('shows the real cards once loaded with results', () => {
    expect(shouldShowPlaceholders(false, 3)).toBe(false);
  });
});
