from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_validator


# Enumerates allowed factions for RSVP selection.
class FactionEnum(str, Enum):
    scout_regiment = "scout_regiment"
    military_police = "military_police"
    garrison = "garrison"


# Validates RSVP confirmation request payload.
class RSVPConfirmRequest(BaseModel):
    invitation_token: str
    attending: bool
    faction: Optional[FactionEnum] = None
    dietary_notes: Optional[str] = None

    # Requires a faction only when the guest is attending.
    @model_validator(mode="after")
    def validate_attending_faction_rule(self):
        if self.attending and self.faction is None:
            raise ValueError("Faction is required when attending is true.")
        return self
