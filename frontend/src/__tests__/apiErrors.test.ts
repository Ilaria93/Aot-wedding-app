import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, getApiStatusCode } from '@/services/apiErrors';
import { getAuthApiErrorMessage } from '@/services/authApiErrors';

const translate = (key: string) => key;

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

  it('formats FastAPI validation arrays', () => {
    const error = new AxiosError('Request failed', 'ERR', undefined, undefined, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: {
        detail: [
          {
            type: 'value_error',
            loc: ['body', 'password'],
            msg: 'Value error, Password must be at least 8 characters long.',
            input: 'test',
          },
        ],
      },
    });

    expect(getApiErrorMessage(error, 'fallback')).toBe('Password must be at least 8 characters long.');
  });

  it('returns fallback when detail is missing', () => {
    const error = new AxiosError('Network error');

    expect(getApiStatusCode(error)).toBeUndefined();
    expect(getApiErrorMessage(error, 'Something went wrong')).toBe('Something went wrong');
  });
});

describe('authApiErrors', () => {
  it('maps register password validation to localized key', () => {
    const error = new AxiosError('Request failed', 'ERR', undefined, undefined, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: {} as never,
      data: {
        detail: [
          {
            type: 'value_error',
            loc: ['body', 'password'],
            msg: 'Value error, Password must be at least 8 characters long.',
            input: 'test',
          },
        ],
      },
    });

    expect(getAuthApiErrorMessage(error, translate, 'register', 'fallback')).toBe(
      'register.validation.passwordMinLength',
    );
  });
});
