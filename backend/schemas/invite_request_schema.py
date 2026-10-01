from typing import Literal

from pydantic import BaseModel, Field, field_validator


class InviteRequestCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str = Field(max_length=40)
    # Honeypot: real guests never see this field; anything here means a bot.
    website: str = Field(default="", max_length=200)

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Required.")
        if len(value) > 80:
            raise ValueError("Too long.")
        return value


class InviteRequestAccepted(BaseModel):
    status: Literal["received"] = "received"
