from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database.base import get_db
from models.user_model import User
from services.auth_cookie_service import ACCESS_TOKEN_COOKIE
from services.auth_service import (
    AuthPermissionError,
    AuthValidationError,
    get_user_by_access_token,
    require_admin_role,
)


# Resolves the currently authenticated user from the httpOnly access-token cookie.
def require_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    access_token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token.",
        )

    try:
        return get_user_by_access_token(db, access_token)
    except AuthValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error


# Ensures the current user can access the wedding management area.
def require_admin_user(current_user: User = Depends(require_current_user)) -> User:
    try:
        require_admin_role(current_user)
    except AuthPermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    return current_user
