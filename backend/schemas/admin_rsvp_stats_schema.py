from pydantic import BaseModel


# Aggregated RSVP statistics for the admin dashboard.
class AdminRsvpStatsResponse(BaseModel):
    total_invited: int
    total_confirmed: int
    total_attending: int
    total_not_attending: int
    by_faction: dict[str, int]
