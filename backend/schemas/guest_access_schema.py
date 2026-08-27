from typing import Annotated

from pydantic import BaseModel, Field

from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse

# Deliberately a hand-rolled pattern rather than pydantic's EmailStr: that would
# pull in the `email-validator` dependency for what is really a typo guard.
# max_length matches users.email / guest_magic_links.email (varchar(160)) so an
# oversized address is a 422, not a DB-layer 500.
GuestEmail = Annotated[
    str,
    Field(min_length=3, max_length=160, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"),
]


class GuestRsvpConfirmRequest(RSVPSubmitRequest):
    email: GuestEmail


class GuestRsvpConfirmResponse(BaseModel):
    session: AuthSessionResponse
    rsvp: RsvpSubmitResponse


class GuestMagicLinkRequest(BaseModel):
    email: GuestEmail


class GuestMagicLinkRequestResponse(BaseModel):
    ok: bool = True
