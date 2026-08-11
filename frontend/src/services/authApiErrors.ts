import {
  extractApiValidationErrors,
  getApiErrorMessage,
  type ApiValidationErrorItem,
} from '@/services/apiErrors';
import { AUTH_ERROR_CODES } from '@/services/authErrorCodes';

type TranslateFn = (key: string) => string;

function validationField(item: ApiValidationErrorItem): string {
  const location = item.loc ?? [];
  return String(location[location.length - 1] ?? '');
}

function mapRegisterValidationError(item: ApiValidationErrorItem, translate: TranslateFn): string | null {
  const field = validationField(item);
  const message = item.msg ?? '';

  if (field === 'password' && message.includes('at least 8')) {
    return translate('register.validation.passwordMinLength');
  }

  if (field === 'password' && message.includes('cannot be empty')) {
    return translate('register.validation.passwordRequired');
  }

  if (field === 'first_name' && message.includes('cannot be empty')) {
    return translate('register.validation.firstNameRequired');
  }

  if (field === 'last_name' && message.includes('cannot be empty')) {
    return translate('register.validation.lastNameRequired');
  }

  if (field === 'email' && message.includes('cannot be empty')) {
    return translate('register.validation.emailRequired');
  }

  if (field === 'email' && message.includes('format is invalid')) {
    return translate('register.validation.emailInvalid');
  }

  return null;
}

function mapRegisterErrorCode(code: string, translate: TranslateFn): string | null {
  if (code === AUTH_ERROR_CODES.emailTaken) {
    return translate('register.validation.emailTaken');
  }

  if (code === AUTH_ERROR_CODES.invalidRoleSecret) {
    return translate('register.validation.invalidRoleSecret');
  }

  return null;
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
  scope: 'register' | 'login' | 'profile',
  fallback: string,
): string {
  const validationErrors = extractApiValidationErrors(caughtError);

  if (validationErrors.length > 0) {
    const mapper =
      scope === 'register' ? mapRegisterValidationError : scope === 'login' ? mapLoginValidationError : null;

    if (mapper) {
      const localized = mapper(validationErrors[0], translate);
      if (localized) {
        return localized;
      }
    }
  }

  const requestError = caughtError as { response?: { data?: { detail?: { code?: string } } } };
  const errorCode = requestError.response?.data?.detail?.code;

  if (typeof errorCode === 'string') {
    const localized =
      scope === 'register'
        ? mapRegisterErrorCode(errorCode, translate)
        : scope === 'login'
          ? mapLoginErrorCode(errorCode, translate)
          : null;

    if (localized) {
      return localized;
    }
  }

  return getApiErrorMessage(caughtError, fallback);
}
