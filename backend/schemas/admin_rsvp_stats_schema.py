from pydantic import BaseModel

from schemas.rsvp_enums import FactionEnum


class AdminRsvpStatsResponse(BaseModel):
    total_users: int
    total_confirmed: int
    total_attending: int
    total_not_attending: int
    total_participants: int
    by_faction: dict[FactionEnum, int]
