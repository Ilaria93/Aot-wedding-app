class AuthConfigError(Exception):
    """Raised when auth configuration is incomplete."""


class AuthValidationError(Exception):
    """Raised for invalid credentials or malformed auth state.

    Carries a stable `code` alongside the human-readable message so callers
    (the frontend, other services) can key off something that survives a
    copy edit to the message text.
    """

    def __init__(self, message: str, code: str = "AUTH_ERROR") -> None:
        super().__init__(message)
        self.code = code


class AuthPermissionError(Exception):
    """Raised when a user lacks the required role."""
