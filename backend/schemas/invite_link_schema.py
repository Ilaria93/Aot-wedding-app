from pydantic import BaseModel, ConfigDict

from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS


# Public response for GET /invites/{token} — name only, nothing account-related.
class InviteLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    min_party_guests: int = MIN_PARTY_GUESTS
    max_party_guests: int = MAX_PARTY_GUESTS
