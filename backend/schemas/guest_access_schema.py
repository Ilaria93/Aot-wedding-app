from pydantic import BaseModel

from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse


class GuestRsvpConfirmRequest(RSVPSubmitRequest):
    email: str


class GuestRsvpConfirmResponse(BaseModel):
    session: AuthSessionResponse
    rsvp: RsvpSubmitResponse


class GuestMagicLinkRequest(BaseModel):
    email: str


class GuestMagicLinkRequestResponse(BaseModel):
    ok: bool = True
