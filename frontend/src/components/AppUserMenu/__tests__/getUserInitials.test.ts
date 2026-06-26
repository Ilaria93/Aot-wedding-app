import { describe, expect, it } from 'vitest';

import { getUserInitials } from '@/components/AppUserMenu/getUserInitials';

describe('getUserInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getUserInitials('Ilaria', 'Davide')).toBe('ID');
  });

  it('falls back to question mark when names are empty', () => {
    expect(getUserInitials(' ', '')).toBe('?');
  });
});
