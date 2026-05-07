from typing import Optional

from pydantic import BaseModel


# Response returned when checking RSVP by invitation token.
class RsvpLookupResponse(BaseModel):
    has_rsvp: bool
    guest_full_name: str
    attending: Optional[bool] = None
    faction: Optional[str] = None
    dietary_notes: Optional[str] = None