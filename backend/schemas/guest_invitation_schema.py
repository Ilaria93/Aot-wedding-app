from pydantic import BaseModel, Field


# Validates guest creation payload from admin/dev tools.
class GuestInvitationCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


# Standard response after creating an invitation token.
class GuestInvitationCreateResponse(BaseModel):
    guest_id: int
    full_name: str
    invitation_token: str
