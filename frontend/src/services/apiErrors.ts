import { AxiosError } from 'axios';

export type ApiValidationErrorItem = {
  type?: string;
  loc?: (string | number)[];
  msg?: string;
};

type ApiErrorPayload = {
  detail?: string | ApiValidationErrorItem[];
};

function normalizeValidationMessage(rawMessage: string): string {
  return rawMessage.replace(/^Value error,\s*/i, '').trim();
}

function formatValidationErrors(items: ApiValidationErrorItem[]): string {
  const messages = items
    .map((item) => item.msg)
    .filter((message): message is string => Boolean(message))
    .map(normalizeValidationMessage);

  return messages.join(' ');
}

/** Returns FastAPI/Pydantic validation items when the response body uses an array detail. */
export function extractApiValidationErrors(caughtError: unknown): ApiValidationErrorItem[] {
  const requestError = caughtError as AxiosError<ApiErrorPayload>;
  const detail = requestError.response?.data?.detail;

  return Array.isArray(detail) ? detail : [];
}

export function getApiStatusCode(caughtError: unknown) {
  const requestError = caughtError as AxiosError<ApiErrorPayload>;
  return requestError.response?.status;
}

export function getApiErrorMessage(caughtError: unknown, fallback: string) {
  const requestError = caughtError as AxiosError<ApiErrorPayload>;
  const detail = requestError.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const formatted = formatValidationErrors(detail);
    if (formatted) {
      return formatted;
    }
  }

  return fallback;
}
