from pydantic import BaseModel

from schemas.auth_schema import AuthUserResponse
from schemas.rsvp_confirmation_schema import RsvpSubmitResponse


class GuestRsvpConfirmResponse(BaseModel):
    user: AuthUserResponse
    rsvp: RsvpSubmitResponse
