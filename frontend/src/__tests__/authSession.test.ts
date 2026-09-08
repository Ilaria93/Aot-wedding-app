import { afterEach, describe, expect, it, vi } from 'vitest';

const axiosPostMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: () => ({ post: axiosPostMock }),
  },
}));

const { logoutCurrentSession, refreshAccessToken } = await import('@/services/authSession');

afterEach(() => {
  vi.clearAllMocks();
});

describe('authSession', () => {
  it('returns true when the refresh cookie call succeeds', async () => {
    axiosPostMock.mockResolvedValueOnce({ data: {} });

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(axiosPostMock).toHaveBeenCalledWith('/auth/refresh');
  });

  it('returns false when the refresh call fails', async () => {
    axiosPostMock.mockRejectedValueOnce(new Error('expired'));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
  });

  it('shares a single in-flight refresh across concurrent callers', async () => {
    let resolveRefresh: (value: unknown) => void = () => {};
    axiosPostMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = refreshAccessToken();
    const second = refreshAccessToken();
    resolveRefresh({ data: {} });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
    expect(axiosPostMock).toHaveBeenCalledTimes(1);
  });

  it('logs out on the backend', async () => {
    axiosPostMock.mockResolvedValueOnce({ data: {} });

    await logoutCurrentSession();

    expect(axiosPostMock).toHaveBeenCalledWith('/auth/logout');
  });

  it('stays idempotent when the logout request fails', async () => {
    axiosPostMock.mockRejectedValueOnce(new Error('network error'));

    await expect(logoutCurrentSession()).resolves.toBeUndefined();
  });
});
