from typing import Optional

from pydantic import BaseModel

from schemas.rsvp_enums import IntoleranceEnum, MealChoiceEnum


class RsvpGuestResponse(BaseModel):
    first_name: str
    last_name: str
    meal_choice: MealChoiceEnum
    intolerance: IntoleranceEnum
    dietary_notes: Optional[str] = None


# Response returned when the logged-in user checks their RSVP status.
class RsvpMeResponse(BaseModel):
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[str] = None
    guests: list[RsvpGuestResponse] = []
    editable: bool = True
