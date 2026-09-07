from pydantic import BaseModel

from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RsvpSubmitResponse


class GuestRsvpConfirmResponse(BaseModel):
    session: AuthSessionResponse
    rsvp: RsvpSubmitResponse
