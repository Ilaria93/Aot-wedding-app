from typing import Optional

from pydantic import BaseModel, ConfigDict

from schemas.rsvp_enums import FactionEnum


class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    # Optional: passwordless guest accounts from an invite link have no email.
    email: Optional[str] = None
    role: str
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[FactionEnum] = None
