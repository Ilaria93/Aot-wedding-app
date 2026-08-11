from typing import Optional

from pydantic import BaseModel

from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS
from schemas.rsvp_enums import FactionEnum, IntoleranceEnum, MealChoiceEnum


class RsvpGuestResponse(BaseModel):
    first_name: str
    last_name: str
    meal_choice: MealChoiceEnum
    intolerance: IntoleranceEnum
    dietary_notes: Optional[str] = None


# Response returned when the logged-in user checks their RSVP status.
#
# max_party_guests/min_party_guests ride along here rather than living as a
# separately-declared constant on the frontend: this is every screen's first
# RSVP read, so the party-size policy has exactly one seam (this schema) and
# the frontend is a caller, not a second owner of the same number.
class RsvpMeResponse(BaseModel):
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[FactionEnum] = None
    guests: list[RsvpGuestResponse] = []
    editable: bool = True
    max_party_guests: int = MAX_PARTY_GUESTS
    min_party_guests: int = MIN_PARTY_GUESTS
