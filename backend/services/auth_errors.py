class AuthConfigError(Exception):
    """Raised when auth configuration is incomplete."""


class AuthValidationError(Exception):
    """Raised for invalid credentials or malformed auth state."""


class AuthPermissionError(Exception):
    """Raised when a user lacks the required role."""
