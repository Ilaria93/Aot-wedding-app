import { describe, expect, it } from 'vitest';

import { isPublicPath, requiresAuthentication } from '@/components/AuthGuard/authRouteAccess';

describe('authRouteAccess', () => {
  it('treats landing, album, travel and auth routes as public', () => {
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/album')).toBe(true);
    expect(isPublicPath('/travel')).toBe(true);
    expect(isPublicPath('/auth/login')).toBe(true);
  });

  // No public /rsvp/{token} route exists yet — /rsvp is always protected
  // (see ALWAYS_PROTECTED_PATHS). AuthStackLayout.tsx already special-cases
  // a /rsvp/ prefix for its header title, anticipating the magic-link RSVP
  // route from PRODUCT_DECISIONS.md §1.3, but the route itself isn't wired
  // into App.tsx yet.
  it('protects /rsvp sub-paths until the magic-link route exists', () => {
    expect(isPublicPath('/rsvp/demo-token')).toBe(false);
    expect(requiresAuthentication('/rsvp/demo-token', false)).toBe(true);
  });

  it('always protects profile and admin even in dev unlock mode', () => {
    expect(requiresAuthentication('/profile', true)).toBe(true);
    expect(requiresAuthentication('/admin', true)).toBe(true);
  });

  it('allows public routes when dev unlock is enabled', () => {
    expect(requiresAuthentication('/album', true)).toBe(false);
    expect(requiresAuthentication('/travel', true)).toBe(false);
  });

  it('protects non-public routes when dev unlock is disabled', () => {
    expect(requiresAuthentication('/settings', false)).toBe(true);
    expect(requiresAuthentication('/profile', false)).toBe(true);
  });
});
