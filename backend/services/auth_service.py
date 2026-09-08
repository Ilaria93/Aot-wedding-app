import hmac
from datetime import datetime

from sqlalchemy.orm import Session

from constants.auth_error_codes import INVALID_CREDENTIALS
from models.user_model import User
from schemas.auth_schema import AuthLoginRequest, AuthSessionResponse, ProfileUpdateRequest, UserRoleEnum
from services.auth_errors import AuthConfigError, AuthPermissionError, AuthValidationError
from services.auth_token_service import (
    decode_token,
    ensure_auth_configuration,
    get_user_by_access_token,
    issue_auth_session,
    logout_refresh_session,
    refresh_auth_session,
    serialize_user,
)
from settings import read_wedding_admin_secret

__all__ = [
    "AuthConfigError",
    "AuthPermissionError",
    "AuthValidationError",
    "authenticate_admin",
    "decode_token",
    "get_user_by_access_token",
    "issue_auth_session",
    "logout_refresh_session",
    "refresh_auth_session",
    "require_admin_role",
    "serialize_user",
    "update_user_profile",
]

PRIVILEGED_USER_ROLES = {UserRoleEnum.admin.value}


def _get_or_create_admin_user(db: Session) -> User:
    """There is exactly one admin identity, shared by both spouses — get it,
    or provision it on the very first successful login."""
    user = db.query(User).filter(User.role == UserRoleEnum.admin.value).first()
    if user:
        return user

    user = User(
        first_name="Sposi",
        last_name="",
        email=None,
        password_hash=None,
        role=UserRoleEnum.admin.value,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Unlocks the single shared admin account with a passcode set via the
# WEDDING_ADMIN_SECRET env var — there is no per-person credential, and both
# spouses use the same one. Guests never have a password at all — see
# services/guest_access_service.py.
def authenticate_admin(db: Session, payload: AuthLoginRequest) -> AuthSessionResponse:
    ensure_auth_configuration()
    configured_secret = read_wedding_admin_secret()
    if not configured_secret or not hmac.compare_digest(payload.secret, configured_secret):
        raise AuthValidationError("Invalid secret.", code=INVALID_CREDENTIALS)

    user = _get_or_create_admin_user(db)
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return issue_auth_session(db, user, payload.remember_me)


def update_user_profile(db: Session, user: User, payload: ProfileUpdateRequest) -> User:
    updated_fields = payload.model_dump(exclude_unset=True)
    if "first_name" in updated_fields and updated_fields["first_name"] is not None:
        user.first_name = updated_fields["first_name"]
    if "last_name" in updated_fields and updated_fields["last_name"] is not None:
        user.last_name = updated_fields["last_name"]
    db.commit()
    db.refresh(user)
    return user


def require_admin_role(user: User):
    if user.role not in PRIVILEGED_USER_ROLES:
        raise AuthPermissionError("Admin role required.")
