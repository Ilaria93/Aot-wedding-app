from pydantic import BaseModel


# Public response for GET /invites/{token} — name and party limits only. Never
# exposes the bound account (invite_links.user_id) or phone, even once the
# guest has confirmed through the passwordless RSVP flow.
class InviteLinkResponse(BaseModel):
    first_name: str
    last_name: str
    min_party_guests: int
    max_party_guests: int
