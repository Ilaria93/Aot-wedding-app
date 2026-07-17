from datetime import datetime, timedelta
import hashlib
import hmac

import jwt
from jwt import InvalidTokenError
from sqlalchemy.orm import Session
import secrets

from models.refresh_token_session_model import RefreshTokenSession
from models.user_model import User
from schemas.auth_schema import AuthSessionResponse, AuthUserResponse
from services.auth_errors import AuthConfigError, AuthValidationError
from settings import (
    read_access_token_expiration_minutes,
    read_jwt_secret_key,
    read_refresh_token_expiration_days,
    read_short_refresh_token_expiration_hours,
)

JWT_ALGORITHM = "HS256"


def ensure_auth_configuration():
    if not read_jwt_secret_key():
        raise AuthConfigError("JWT_SECRET_KEY is not configured on this server.")


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


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


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
    ensure_auth_configuration()
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


def decode_token(token: str, expected_type: str) -> dict:
    ensure_auth_configuration()
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
