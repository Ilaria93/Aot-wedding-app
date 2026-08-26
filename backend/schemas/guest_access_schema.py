from pydantic import BaseModel, EmailStr

from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse


class GuestRsvpConfirmRequest(RSVPSubmitRequest):
    email: EmailStr


class GuestRsvpConfirmResponse(BaseModel):
    session: AuthSessionResponse
    rsvp: RsvpSubmitResponse


class GuestMagicLinkRequest(BaseModel):
    email: EmailStr


class GuestMagicLinkRequestResponse(BaseModel):
    ok: bool = True
