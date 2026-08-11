from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_current_user
from models.user_model import User
from schemas.auth_schema import (
    AuthLoginRequest,
    AuthLogoutResponse,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthSessionResponse,
    AuthUserResponse,
    ProfileUpdateRequest,
)
from services.auth_service import (
    AuthValidationError,
    authenticate_user,
    logout_refresh_session,
    register_user,
    refresh_auth_session,
    serialize_user,
    update_user_profile,
)

router = APIRouter(prefix="/auth")


def _auth_error_detail(error: AuthValidationError) -> dict[str, str]:
    """Shapes the HTTP error body around `code`, the seam the frontend keys off,
    with `message` kept only as a human-readable fallback/log line."""
    return {"code": error.code, "message": str(error)}


# Registers a new account and immediately returns an authenticated session.
@router.post("/register", response_model=AuthSessionResponse)
def register_auth_user(payload: AuthRegisterRequest, db: Session = Depends(get_db)):
    try:
        return register_user(db, payload)
    except AuthValidationError as error:
        raise HTTPException(status_code=400, detail=_auth_error_detail(error)) from error


# Logs in an existing account and returns fresh access and refresh tokens.
@router.post("/login", response_model=AuthSessionResponse)
def login_auth_user(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    try:
        return authenticate_user(db, payload)
    except AuthValidationError as error:
        raise HTTPException(status_code=401, detail=_auth_error_detail(error)) from error


# Rotates the refresh session and returns a new token pair.
@router.post("/refresh", response_model=AuthSessionResponse)
def refresh_auth_tokens(payload: AuthRefreshRequest, db: Session = Depends(get_db)):
    try:
        return refresh_auth_session(db, payload.refresh_token)
    except AuthValidationError as error:
        raise HTTPException(status_code=401, detail=_auth_error_detail(error)) from error


# Returns the profile of the currently authenticated user.
@router.get("/me", response_model=AuthUserResponse)
def get_current_profile(current_user: User = Depends(require_current_user)):
    return serialize_user(current_user)


# Lets the logged-in user update profile basics without changing role or email.
@router.patch("/me", response_model=AuthUserResponse)
def update_current_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    updated_user = update_user_profile(db, current_user, payload)
    return serialize_user(updated_user)


# Revokes the current refresh token session on logout.
@router.post("/logout", response_model=AuthLogoutResponse)
def logout_auth_user(payload: AuthRefreshRequest, db: Session = Depends(get_db)):
    try:
        logout_refresh_session(db, payload.refresh_token)
    except AuthValidationError:
        # Logout should stay idempotent even if the client sends a stale token.
        return AuthLogoutResponse(ok=True)
    return AuthLogoutResponse(ok=True)
