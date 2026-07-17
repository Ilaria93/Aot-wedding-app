from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS
from schemas.rsvp_enums import FactionEnum, IntoleranceEnum, MealChoiceEnum


class RsvpGuestLineRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    meal_choice: MealChoiceEnum
    intolerance: IntoleranceEnum
    dietary_notes: Optional[str] = Field(default=None, max_length=250)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Name cannot be empty.")
        return trimmed


class RSVPSubmitRequest(BaseModel):
    attending: bool
    guests: list[RsvpGuestLineRequest] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_guests_for_attendance(self):
        if self.attending:
            count = len(self.guests)
            if count < MIN_PARTY_GUESTS or count > MAX_PARTY_GUESTS:
                raise ValueError(
                    f"Between {MIN_PARTY_GUESTS} and {MAX_PARTY_GUESTS} guests required when attending."
                )
        elif self.guests:
            raise ValueError("Guests must be empty when not attending.")
        return self


class RsvpSubmitResponse(BaseModel):
    ok: bool
    user: str
    faction: Optional[FactionEnum] = None
    guest_count: int = 0
