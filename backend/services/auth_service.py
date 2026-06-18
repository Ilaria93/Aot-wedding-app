from datetime import datetime, timedelta
import hashlib
import hmac
import secrets
from typing import Optional

import jwt
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from models.refresh_token_session_model import RefreshTokenSession
from models.user_model import User
from schemas.auth_schema import (
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthSessionResponse,
    AuthUserResponse,
    ProfileUpdateRequest,
    UserRoleEnum,
)
from settings import (
    read_access_token_expiration_minutes,
    read_jwt_secret_key,
    read_refresh_token_expiration_days,
    read_short_refresh_token_expiration_hours,
    read_wedding_role_secret,
)

PASSWORD_HASH_ITERATIONS = 390000
JWT_ALGORITHM = "HS256"
PRIVILEGED_USER_ROLES = {UserRoleEnum.admin.value}


def _resolve_registration_role(payload: AuthRegisterRequest) -> str:
    provided_secret = (payload.role_secret or "").strip()
    if not provided_secret:
        return UserRoleEnum.user.value

    expected_secret = read_wedding_role_secret()
    if not expected_secret or not hmac.compare_digest(provided_secret, expected_secret):
        raise AuthValidationError("Invalid role secret.")
    return UserRoleEnum.admin.value


class AuthConfigError(Exception):
    """Raised when auth configuration is incomplete."""


class AuthValidationError(Exception):
    """Raised for invalid credentials or malformed auth state."""


class AuthPermissionError(Exception):
    """Raised when a user lacks the required role."""


def _ensure_auth_configuration():
    if not read_jwt_secret_key():
        raise AuthConfigError("JWT_SECRET_KEY is not configured on this server.")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _build_password_hash(password: str, salt: str, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return digest.hex()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = _build_password_hash(password, salt, PASSWORD_HASH_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, digest = stored_password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        expected_digest = _build_password_hash(password, salt, int(iterations))
        return hmac.compare_digest(expected_digest, digest)
    except ValueError:
        return False


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def serialize_user(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


def _build_access_token(user: User) -> tuple[str, int]:
    expires_in_seconds = read_access_token_expiration_minutes() * 60
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    access_token = jwt.encode(
        {
            "sub": str(user.id),
            "type": "access",
            "exp": expires_at,
        },
        read_jwt_secret_key(),
        algorithm=JWT_ALGORITHM,
    )
    return access_token, expires_in_seconds


def _build_refresh_token(user: User, remember_me: bool) -> tuple[str, str, datetime, int]:
    if remember_me:
        expires_in_seconds = read_refresh_token_expiration_days() * 24 * 60 * 60
    else:
        expires_in_seconds = read_short_refresh_token_expiration_hours() * 60 * 60

    expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    jti = secrets.token_hex(16)
    refresh_token = jwt.encode(
        {
            "sub": str(user.id),
            "type": "refresh",
            "jti": jti,
            "remember_me": remember_me,
            "exp": expires_at,
        },
        read_jwt_secret_key(),
        algorithm=JWT_ALGORITHM,
    )
    return refresh_token, jti, expires_at, expires_in_seconds


def _revoke_session(db: Session, refresh_session: RefreshTokenSession):
    if refresh_session.revoked_at is None:
        refresh_session.revoked_at = datetime.utcnow()
        db.commit()


def issue_auth_session(db: Session, user: User, remember_me: bool) -> AuthSessionResponse:
    _ensure_auth_configuration()
    access_token, access_expires_in_seconds = _build_access_token(user)
    refresh_token, jti, refresh_expires_at, refresh_expires_in_seconds = _build_refresh_token(
        user, remember_me
    )
    refresh_session = RefreshTokenSession(
        user_id=user.id,
        jti=jti,
        refresh_token_hash=hash_refresh_token(refresh_token),
        remember_me=remember_me,
        created_at=datetime.utcnow(),
        expires_at=refresh_expires_at,
        revoked_at=None,
    )
    db.add(refresh_session)
    db.commit()

    return AuthSessionResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        access_token_expires_in_seconds=access_expires_in_seconds,
        refresh_token_expires_in_seconds=refresh_expires_in_seconds,
        remember_me=remember_me,
        user=serialize_user(user),
    )


def register_user(db: Session, payload: AuthRegisterRequest) -> AuthSessionResponse:
    _ensure_auth_configuration()
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
    _ensure_auth_configuration()
    normalized_email = normalize_email(payload.email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise AuthValidationError("Invalid email or password.")

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return issue_auth_session(db, user, payload.remember_me)


def decode_token(token: str, expected_type: str) -> dict:
    _ensure_auth_configuration()
    try:
        payload = jwt.decode(token, read_jwt_secret_key(), algorithms=[JWT_ALGORITHM])
    except InvalidTokenError as error:
        raise AuthValidationError("Invalid or expired token.") from error

    token_type = payload.get("type")
    if token_type != expected_type:
        raise AuthValidationError("Invalid token type.")
    return payload


def get_user_by_access_token(db: Session, access_token: str) -> User:
    payload = decode_token(access_token, "access")
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as error:
        raise AuthValidationError("Token subject is invalid.") from error

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthValidationError("User not found for this token.")

    return user


def refresh_auth_session(db: Session, refresh_token: str) -> AuthSessionResponse:
    payload = decode_token(refresh_token, "refresh")
    try:
        user_id = int(payload["sub"])
        jti = str(payload["jti"])
        remember_me = bool(payload.get("remember_me", True))
    except (KeyError, TypeError, ValueError) as error:
        raise AuthValidationError("Refresh token payload is invalid.") from error

    refresh_session = (
        db.query(RefreshTokenSession)
        .filter(
            RefreshTokenSession.user_id == user_id,
            RefreshTokenSession.jti == jti,
        )
        .first()
    )
    if not refresh_session or refresh_session.revoked_at is not None:
        raise AuthValidationError("Refresh session is no longer valid.")
    if refresh_session.expires_at <= datetime.utcnow():
        raise AuthValidationError("Refresh session has expired.")
    if not hmac.compare_digest(refresh_session.refresh_token_hash, hash_refresh_token(refresh_token)):
        raise AuthValidationError("Refresh session does not match.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthValidationError("User not found for this refresh token.")

    _revoke_session(db, refresh_session)
    return issue_auth_session(db, user, remember_me)


def logout_refresh_session(db: Session, refresh_token: str):
    payload = decode_token(refresh_token, "refresh")
    try:
        user_id = int(payload["sub"])
        jti = str(payload["jti"])
    except (KeyError, TypeError, ValueError) as error:
        raise AuthValidationError("Refresh token payload is invalid.") from error

    refresh_session = (
        db.query(RefreshTokenSession)
        .filter(
            RefreshTokenSession.user_id == user_id,
            RefreshTokenSession.jti == jti,
        )
        .first()
    )
    if not refresh_session:
        return
    _revoke_session(db, refresh_session)


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
