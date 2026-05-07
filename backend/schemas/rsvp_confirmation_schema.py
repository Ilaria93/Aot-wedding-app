from enum import Enum
from typing import Optional

from pydantic import BaseModel


# Enumerates allowed factions for RSVP selection.
class FactionEnum(str, Enum):
    scout_regiment = "scout_regiment"
    military_police = "military_police"
    garrison = "garrison"


# Validates RSVP confirmation request payload.
class RSVPConfirmRequest(BaseModel):
    invitation_token: str
    attending: bool
    faction: FactionEnum
    dietary_notes: Optional[str] = None
