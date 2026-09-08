from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class UserRoleEnum(str, Enum):
    user = "user"
    admin = "admin"


class AuthLoginRequest(BaseModel):
    secret: str
    remember_me: bool = True

    @field_validator("secret")
    @classmethod
    def validate_login_secret(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Secret cannot be empty.")
        return value


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_profile_fields(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class AuthUserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    # Optional: no account sets an email anymore — guests come from a
    # WhatsApp invite link, and the single shared admin account is unlocked
    # by a passcode, not a per-person login.
    email: Optional[str] = None
    role: UserRoleEnum
    created_at: datetime
    last_login_at: Optional[datetime] = None


class AuthSessionResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    access_token_expires_in_seconds: int
    refresh_token_expires_in_seconds: int
    remember_me: bool
    user: AuthUserResponse


class AuthLogoutResponse(BaseModel):
    ok: bool
