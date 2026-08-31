from pydantic import BaseModel, ConfigDict

from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS


# Public response for GET /invites/{token} — name and party limits only. Never
# exposes the bound account (invite_links.user_id), even once the guest has
# confirmed through the passwordless RSVP flow.
class InviteLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    min_party_guests: int = MIN_PARTY_GUESTS
    max_party_guests: int = MAX_PARTY_GUESTS
