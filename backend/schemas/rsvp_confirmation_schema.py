from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_validator


class FactionEnum(str, Enum):
    scout_regiment = "scout_regiment"
    military_police = "military_police"
    garrison = "garrison"


class RSVPConfirmRequest(BaseModel):
    attending: bool
    faction: Optional[FactionEnum] = None
    dietary_notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_attending_faction_rule(self):
        if self.attending and self.faction is None:
            raise ValueError("Faction is required when attending is true.")
        return self
