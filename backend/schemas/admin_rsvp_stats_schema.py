from pydantic import BaseModel

from schemas.rsvp_enums import FactionEnum, MealChoiceEnum


class InviteBucket(BaseModel):
    invites: int
    persons: int


class InviteStats(BaseModel):
    total: int
    to_send: InviteBucket
    waiting: InviteBucket
    attending: InviteBucket
    declined: InviteBucket


class AdminRsvpStatsResponse(BaseModel):
    total_users: int
    total_confirmed: int
    total_attending: int
    total_not_attending: int
    total_participants: int
    total_children: int
    invites: InviteStats
    by_faction: dict[FactionEnum, int]
    by_meal_choice: dict[MealChoiceEnum, int]
    # Staff = suppliers' people who eat at the reception (see StaffGuest); meals = guests + staff.
    staff_count: int
    meals_total: int
    meals_by_choice: dict[MealChoiceEnum, int]
