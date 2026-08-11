/**
 * Stable auth error codes shared with the backend's `AuthValidationError`.
 *
 * This is the seam: copy is keyed off `code`, never off the human-readable
 * message, so either side can reword its text without silently breaking the
 * other. Keep this list mirrored in backend/constants/auth_error_codes.py.
 */
export const AUTH_ERROR_CODES = {
  invalidRoleSecret: 'INVALID_ROLE_SECRET',
  emailTaken: 'EMAIL_TAKEN',
  invalidCredentials: 'INVALID_CREDENTIALS',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
