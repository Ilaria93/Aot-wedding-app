from datetime import datetime
import hmac

from sqlalchemy.orm import Session

from models.user_model import User
from schemas.auth_schema import (
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthSessionResponse,
    ProfileUpdateRequest,
    UserRoleEnum,
)
from services.auth_credentials_service import hash_password, normalize_email, verify_password
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
from settings import read_wedding_role_secret

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
    "register_user",
    "require_admin_role",
    "serialize_user",
    "update_user_profile",
]

PRIVILEGED_USER_ROLES = {UserRoleEnum.admin.value}


def _resolve_registration_role(payload: AuthRegisterRequest) -> str:
    provided_secret = (payload.role_secret or "").strip()
    if not provided_secret:
        return UserRoleEnum.user.value

    expected_secret = read_wedding_role_secret()
    if not expected_secret or not hmac.compare_digest(provided_secret, expected_secret):
        raise AuthValidationError("Invalid role secret.")
    return UserRoleEnum.admin.value


def register_user(db: Session, payload: AuthRegisterRequest) -> AuthSessionResponse:
    ensure_auth_configuration()
    normalized_email = normalize_email(payload.email)
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise AuthValidationError("An account with this email already exists.")

    created_user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=_resolve_registration_role(payload),
        created_at=datetime.utcnow(),
        last_login_at=datetime.utcnow(),
    )
    db.add(created_user)
    db.commit()
    db.refresh(created_user)
    return issue_auth_session(db, created_user, payload.remember_me)


def authenticate_user(db: Session, payload: AuthLoginRequest) -> AuthSessionResponse:
    ensure_auth_configuration()
    normalized_email = normalize_email(payload.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise AuthValidationError("Invalid email or password.")

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
