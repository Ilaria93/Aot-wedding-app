from datetime import datetime

from sqlalchemy.orm import Session

from constants.auth_error_codes import INVALID_CREDENTIALS
from models.user_model import User
from schemas.auth_schema import AuthLoginRequest, AuthSessionResponse, ProfileUpdateRequest, UserRoleEnum
from services.auth_credentials_service import normalize_email, verify_password
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

__all__ = [
    "AuthConfigError",
    "AuthPermissionError",
    "AuthValidationError",
    "authenticate_user",
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


# Admin-only: accounts are seeded directly in the database (see
# scripts/seed_admin_users.py), never created through this endpoint. Guests
# never have a password at all — see services/guest_access_service.py.
def authenticate_user(db: Session, payload: AuthLoginRequest) -> AuthSessionResponse:
    ensure_auth_configuration()
    normalized_email = normalize_email(payload.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise AuthValidationError("Invalid email or password.", code=INVALID_CREDENTIALS)

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
