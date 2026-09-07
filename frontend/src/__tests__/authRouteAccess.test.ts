import { describe, expect, it } from 'vitest';

import { isPublicPath, requiresAuthentication } from '@/components/AuthGuard/authRouteAccess';

describe('authRouteAccess', () => {
  it('treats landing, album, tema and auth routes as public', () => {
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/album')).toBe(true);
    expect(isPublicPath('/tema')).toBe(true);
    expect(isPublicPath('/auth/login')).toBe(true);
  });

  it('always protects profile, admin and travel even in dev unlock mode', () => {
    expect(requiresAuthentication('/profile', true)).toBe(true);
    expect(requiresAuthentication('/admin', true)).toBe(true);
    expect(requiresAuthentication('/travel', true)).toBe(true);
  });

  it('allows public routes when dev unlock is enabled', () => {
    expect(requiresAuthentication('/album', true)).toBe(false);
    expect(requiresAuthentication('/tema', true)).toBe(false);
  });

  it('protects non-public routes when dev unlock is disabled', () => {
    expect(requiresAuthentication('/settings', false)).toBe(true);
    expect(requiresAuthentication('/profile', false)).toBe(true);
  });
});
