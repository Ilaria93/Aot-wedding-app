from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_current_user
from models.user_model import User
from schemas.auth_schema import AuthLoginRequest, AuthLogoutResponse, AuthUserResponse, ProfileUpdateRequest
from services.auth_cookie_service import REFRESH_TOKEN_COOKIE, clear_auth_cookies, set_auth_cookies
from services.auth_service import (
    AuthValidationError,
    authenticate_admin,
    logout_refresh_session,
    refresh_auth_session,
    serialize_user,
    update_user_profile,
)

router = APIRouter(prefix="/auth")


def _auth_error_detail(error: AuthValidationError) -> dict[str, str]:
    """Shapes the HTTP error body around `code`, the seam the frontend keys off,
    with `message` kept only as a human-readable fallback/log line."""
    return {"code": error.code, "message": str(error)}


# Unlocks the single shared admin account with the WEDDING_ADMIN_SECRET
# passcode — no per-person credential, no public registration endpoint.
# Tokens go in httpOnly cookies, never in the response body.
@router.post("/login", response_model=AuthUserResponse)
def login_auth_user(payload: AuthLoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        session = authenticate_admin(db, payload)
    except AuthValidationError as error:
        raise HTTPException(status_code=401, detail=_auth_error_detail(error)) from error
    set_auth_cookies(response, session)
    return session.user


# Rotates the refresh session using the refresh-token cookie, and sets fresh cookies.
@router.post("/refresh", response_model=AuthUserResponse)
def refresh_auth_tokens(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not refresh_token:
        raise HTTPException(status_code=401, detail={"code": "INVALID_CREDENTIALS", "message": "Missing refresh token."})
    try:
        session = refresh_auth_session(db, refresh_token)
    except AuthValidationError as error:
        raise HTTPException(status_code=401, detail=_auth_error_detail(error)) from error
    set_auth_cookies(response, session)
    return session.user


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


# Revokes the current refresh token session and clears both cookies.
@router.post("/logout", response_model=AuthLogoutResponse)
def logout_auth_user(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if refresh_token:
        try:
            logout_refresh_session(db, refresh_token)
        except AuthValidationError:
            pass  # Logout stays idempotent even if the cookie holds a stale token.
    clear_auth_cookies(response)
    return AuthLogoutResponse(ok=True)
