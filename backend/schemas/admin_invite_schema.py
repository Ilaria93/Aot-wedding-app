from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

InviteAnswer = Literal["none", "attending", "declined"]
Gender = Literal["m", "f"]
Relation = Literal["spouse", "partner", "child", "other"]
GreetingKind = Literal["family", "couple", "single_m", "single_f", "single"]


class ChangeHeadRequest(BaseModel):
    new_head_id: int


class AdminInviteMember(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    relation: Relation
    # Only meaningful when the group was sent as one invite per person.
    sent_at: Optional[datetime] = None
    answer: InviteAnswer = "none"
    invite_url: Optional[str] = None


class AdminInviteResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    family_name: Optional[str] = None
    party_size: Optional[int] = None
    # When the whole group was sent: for an individual group, once every person has been.
    sent_at: Optional[datetime] = None
    # The head's own send time (differs from sent_at while an individual group is only partly sent).
    own_sent_at: Optional[datetime] = None
    # The head's own answer; each member's is on the member (individual groups).
    answer: InviteAnswer
    # True when the group is sent as one invite per person (own link, own greeting, own answer).
    individual: bool = False
    invite_url: str
    whatsapp_url: str
    greeting_kind: GreetingKind
    greeting_name: str
    greeting_names: list[str]
    # False once the invite has been sent: the group is then locked, only resend.
    editable: bool
    members: list[AdminInviteMember] = []


def _clean(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    return value or None


class _PersonFields(BaseModel):
    @field_validator("first_name", "last_name", "family_name", "phone", check_fields=False, mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("first_name", "last_name", check_fields=False)
    @classmethod
    def not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (not value or len(value) > 80):
            raise ValueError("Required, up to 80 characters.")
        return value

    @field_validator("family_name", check_fields=False)
    @classmethod
    def family_name_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value) > 80:
            raise ValueError("Up to 80 characters.")
        return value or None


class AdminInviteCreate(_PersonFields):
    first_name: str
    last_name: str
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    # Without head_id the person is a head and receives the invite.
    head_id: Optional[int] = None
    relation: Optional[Relation] = None
    family_name: Optional[str] = None
    party_size: Optional[int] = Field(default=None, ge=1, le=10)


class AdminInviteUpdate(_PersonFields):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    relation: Optional[Relation] = None
    family_name: Optional[str] = None
    party_size: Optional[int] = Field(default=None, ge=1, le=10)


class InviteMatchHead(BaseModel):
    id: int
    first_name: str
    last_name: str
    sent_at: Optional[datetime] = None


class InviteMatch(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    relation: Optional[Relation] = None
    head: InviteMatchHead


class ImportRowError(BaseModel):
    row: int
    reason: str


class ImportReport(BaseModel):
    created: int
    skipped_duplicates: list[str]
    errors: list[ImportRowError]
