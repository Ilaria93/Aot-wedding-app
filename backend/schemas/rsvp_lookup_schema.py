from typing import Optional

from pydantic import BaseModel


# Response returned when the logged-in user checks their RSVP status.
class RsvpMeResponse(BaseModel):
    has_rsvp: bool
    attending: Optional[bool] = None
    faction: Optional[str] = None
    dietary_notes: Optional[str] = None
