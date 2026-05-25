from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database.base import get_db
from models.user_model import User
from services.auth_service import (
    AuthPermissionError,
    AuthValidationError,
    get_user_by_access_token,
    require_admin_role,
)

bearer_scheme = HTTPBearer(auto_error=False, description="Bearer access token returned by /auth/login.")


# Resolves the currently authenticated user from the bearer access token.
def require_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Security(bearer_scheme)],
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer access token.",
        )

    try:
        return get_user_by_access_token(db, credentials.credentials)
    except AuthValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error


# Ensures the current user exists and has the admin role.
def require_admin_user(current_user: User = Depends(require_current_user)) -> User:
    try:
        require_admin_role(current_user)
    except AuthPermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    return current_user
