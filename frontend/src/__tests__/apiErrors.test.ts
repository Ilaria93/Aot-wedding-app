import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, getApiStatusCode } from '@/services/apiErrors';

describe('apiErrors', () => {
  it('reads HTTP status from axios errors', () => {
    const error = new AxiosError('Request failed', 'ERR', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { detail: 'Already confirmed' },
    });

    expect(getApiStatusCode(error)).toBe(409);
    expect(getApiErrorMessage(error, 'fallback')).toBe('Already confirmed');
  });

  it('returns fallback when detail is missing', () => {
    const error = new AxiosError('Network error');

    expect(getApiStatusCode(error)).toBeUndefined();
    expect(getApiErrorMessage(error, 'Something went wrong')).toBe('Something went wrong');
  });
});
