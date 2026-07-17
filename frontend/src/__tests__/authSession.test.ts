import { afterEach, describe, expect, it, vi } from 'vitest';

const authStorageMock = {
  persistAuthSession: vi.fn(async () => {}),
  readStoredAuthSession: vi.fn(async () => null),
  clearStoredAuthSession: vi.fn(async () => {}),
};

vi.mock('@/services/authSessionStorage', () => authStorageMock);

const axiosPostMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: () => ({ post: axiosPostMock }),
  },
}));

const {
  clearCurrentSession,
  getAccessToken,
  getCurrentSession,
  getRefreshToken,
  logoutCurrentSession,
  refreshAccessToken,
  restoreRememberedSession,
  setCurrentSession,
  subscribeToSessionChanges,
} = await import('@/services/authSession');

const remembered = { accessToken: 'access-1', refreshToken: 'refresh-1', rememberMe: true };
const notRemembered = { accessToken: 'access-2', refreshToken: 'refresh-2', rememberMe: false };

afterEach(async () => {
  await clearCurrentSession();
  vi.clearAllMocks();
});

describe('authSession', () => {
  it('has no session by default', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCurrentSession()).toBeNull();
  });

  it('persists the session in storage when rememberMe is true', async () => {
    await setCurrentSession(remembered);

    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
    expect(authStorageMock.persistAuthSession).toHaveBeenCalledWith(remembered);
    expect(authStorageMock.clearStoredAuthSession).not.toHaveBeenCalled();
  });

  it('clears storage instead of persisting when rememberMe is false', async () => {
    await setCurrentSession(notRemembered);

    expect(getAccessToken()).toBe('access-2');
    expect(authStorageMock.clearStoredAuthSession).toHaveBeenCalledTimes(1);
    expect(authStorageMock.persistAuthSession).not.toHaveBeenCalled();
  });

  it('notifies subscribers whenever the session changes', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionChanges(listener);

    await setCurrentSession(remembered);
    await clearCurrentSession();
    unsubscribe();

    expect(listener).toHaveBeenNthCalledWith(1, remembered);
    expect(listener).toHaveBeenNthCalledWith(2, null);
  });

  it('restores a remembered session from storage', async () => {
    authStorageMock.readStoredAuthSession.mockResolvedValueOnce(remembered);

    const restored = await restoreRememberedSession();

    expect(restored).toEqual(remembered);
    expect(getAccessToken()).toBe('access-1');
  });

  it('returns null when refreshing without a refresh token', async () => {
    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(axiosPostMock).not.toHaveBeenCalled();
  });

  it('rotates the token pair on a successful refresh', async () => {
    await setCurrentSession(remembered);
    axiosPostMock.mockResolvedValueOnce({
      data: { access_token: 'access-3', refresh_token: 'refresh-3', remember_me: true },
    });

    const nextAccessToken = await refreshAccessToken();

    expect(nextAccessToken).toBe('access-3');
    expect(getAccessToken()).toBe('access-3');
    expect(getRefreshToken()).toBe('refresh-3');
    expect(axiosPostMock).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'refresh-1' });
  });

  it('shares a single in-flight refresh across concurrent callers', async () => {
    await setCurrentSession(remembered);
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosPostMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = refreshAccessToken();
    const second = refreshAccessToken();

    resolveRefresh({
      data: { access_token: 'access-4', refresh_token: 'refresh-4', remember_me: true },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe('access-4');
    expect(secondResult).toBe('access-4');
    expect(axiosPostMock).toHaveBeenCalledTimes(1);
  });

  it('clears the session when the refresh request fails', async () => {
    await setCurrentSession(remembered);
    axiosPostMock.mockRejectedValueOnce(new Error('expired'));

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(getCurrentSession()).toBeNull();
  });

  it('logs out on the backend and clears the local session', async () => {
    await setCurrentSession(remembered);
    axiosPostMock.mockResolvedValueOnce({ data: {} });

    await logoutCurrentSession();

    expect(axiosPostMock).toHaveBeenCalledWith('/auth/logout', { refresh_token: 'refresh-1' });
    expect(getCurrentSession()).toBeNull();
  });

  it('still clears the local session when the logout request fails', async () => {
    await setCurrentSession(remembered);
    axiosPostMock.mockRejectedValueOnce(new Error('network error'));

    await expect(logoutCurrentSession()).resolves.toBeUndefined();
    expect(getCurrentSession()).toBeNull();
  });

  it('skips the logout request when there is no refresh token', async () => {
    await logoutCurrentSession();

    expect(axiosPostMock).not.toHaveBeenCalled();
  });
});
