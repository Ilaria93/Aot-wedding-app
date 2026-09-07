import {
  extractApiValidationErrors,
  getApiErrorMessage,
  type ApiValidationErrorItem,
} from '@/services/apiErrors';
import { AUTH_ERROR_CODES } from '@/services/authErrorCodes';
import type { TranslateFn } from '@/i18n/translations';

function validationField(item: ApiValidationErrorItem): string {
  const location = item.loc ?? [];
  return String(location[location.length - 1] ?? '');
}

function mapLoginValidationError(item: ApiValidationErrorItem, translate: TranslateFn): string | null {
  const field = validationField(item);
  const message = item.msg ?? '';

  if (field === 'email' && message.includes('format is invalid')) {
    return translate('login.validation.emailInvalid');
  }

  if (field === 'password' && message.includes('cannot be empty')) {
    return translate('login.validation.passwordRequired');
  }

  return null;
}

function mapLoginErrorCode(code: string, translate: TranslateFn): string | null {
  if (code === AUTH_ERROR_CODES.invalidCredentials) {
    return translate('login.validation.invalidCredentials');
  }

  return null;
}

/** Maps auth endpoint errors to localized, user-facing messages. */
export function getAuthApiErrorMessage(
  caughtError: unknown,
  translate: TranslateFn,
  scope: 'login' | 'profile',
  fallback: string,
): string {
  const validationErrors = extractApiValidationErrors(caughtError);

  if (validationErrors.length > 0 && scope === 'login') {
    const localized = mapLoginValidationError(validationErrors[0], translate);
    if (localized) {
      return localized;
    }
  }

  const requestError = caughtError as { response?: { data?: { detail?: { code?: string } } } };
  const errorCode = requestError.response?.data?.detail?.code;

  if (typeof errorCode === 'string' && scope === 'login') {
    const localized = mapLoginErrorCode(errorCode, translate);
    if (localized) {
      return localized;
    }
  }

  return getApiErrorMessage(caughtError, fallback);
}
