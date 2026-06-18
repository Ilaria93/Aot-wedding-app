from pydantic import BaseModel


class AdminRsvpStatsResponse(BaseModel):
    total_users: int
    total_confirmed: int
    total_attending: int
    total_not_attending: int
    by_faction: dict[str, int]
