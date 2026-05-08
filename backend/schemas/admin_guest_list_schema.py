from typing import Optional
from pydantic import BaseModel, ConfigDict


# Represents one guest row in the admin list response.
class AdminGuestListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    invitation_token: str
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[str] = None