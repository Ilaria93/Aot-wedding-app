import { AxiosError } from 'axios';

type ApiErrorPayload = {
  detail?: string;
};

export function getApiStatusCode(caughtError: unknown) {
  const requestError = caughtError as AxiosError<ApiErrorPayload>;
  return requestError.response?.status;
}

export function getApiErrorMessage(caughtError: unknown, fallback: string) {
  const requestError = caughtError as AxiosError<ApiErrorPayload>;
  return requestError.response?.data?.detail || fallback;
}
