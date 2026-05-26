from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class UserRoleEnum(str, Enum):
    invited = "invited"
    bride = "bride"
    groom = "groom"
    admin = "admin"


class AuthSelectableRoleEnum(str, Enum):
    invited = "invited"
    bride = "bride"
    groom = "groom"


class AuthRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: AuthSelectableRoleEnum = AuthSelectableRoleEnum.invited
    remember_me: bool = True

    @field_validator("first_name", "last_name", "password", "email")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be empty.")
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Email format is invalid.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return value


class AuthLoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = True

    @field_validator("email")
    @classmethod
    def validate_login_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Email format is invalid.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_login_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be empty.")
        return value


class AuthRefreshRequest(BaseModel):
    refresh_token: str

    @field_validator("refresh_token")
    @classmethod
    def validate_refresh_token(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("refresh_token cannot be empty.")
        return normalized


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
    email: str
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
