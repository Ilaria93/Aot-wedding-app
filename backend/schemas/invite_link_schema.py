from pydantic import BaseModel, ConfigDict


# Public response for GET /invites/{token} — name only, nothing account-related.
class InviteLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
