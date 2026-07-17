from typing import Optional

from pydantic import BaseModel, ConfigDict

from schemas.rsvp_enums import FactionEnum


class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[FactionEnum] = None
