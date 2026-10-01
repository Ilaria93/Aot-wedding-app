from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

InviteRequestStatus = Literal["pending", "approved", "rejected"]


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


class ExistingInviteSummary(BaseModel):
    id: int
    first_name: str
    last_name: str


class InviteRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    phone: str
    status: InviteRequestStatus
    created_at: datetime
    decided_at: Optional[datetime] = None
    invite_link_id: Optional[int] = None
    existing_invite: Optional[ExistingInviteSummary] = None


class PendingCountResponse(BaseModel):
    pending: int


class ApproveInviteRequestResponse(BaseModel):
    invite_link_id: int
    invite_url: str
    whatsapp_url: str
