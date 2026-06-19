import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TITAN_SCALE,
  TITAN_PREVIEW_CAMERA_PRESETS,
  TITAN_SCALE_PRESETS,
} from '@/constants/titanPreviewConfig';

describe('titanPreviewAssets', () => {
  it('defaults to colossal scale and foot-close camera for scale validation', () => {
    expect(DEFAULT_TITAN_SCALE).toBe(20);
    expect(TITAN_SCALE_PRESETS.some((preset) => preset.value === 50)).toBe(true);
    expect(TITAN_PREVIEW_CAMERA_PRESETS[0]?.id).toBe('foot');
  });
});
