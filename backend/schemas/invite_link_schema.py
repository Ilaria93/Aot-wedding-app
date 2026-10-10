from typing import Literal

from pydantic import BaseModel


# Public response for GET /invites/{token} — name and party limits only. Never
# exposes the bound account (invite_links.user_id) or phone, even once the
# guest has confirmed through the passwordless RSVP flow.
class InviteLinkResponse(BaseModel):
    first_name: str
    last_name: str
    # Computed from the group (family / couple / single): see invite_greeting_service.
    greeting_kind: Literal["family", "couple", "single_m", "single_f", "single"]
    greeting_name: str
    # The same names as a list (several for a couple) so clients can join them in their language.
    greeting_names: list[str]
    min_party_guests: int
    max_party_guests: int
    # What the form starts with (the couple's preset or the group size); editable up to the max.
    default_party_guests: int
