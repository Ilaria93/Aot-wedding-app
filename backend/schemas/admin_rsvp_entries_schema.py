from enum import Enum
from typing import Optional

from pydantic import BaseModel

from schemas.rsvp_enums import FactionEnum, IntoleranceEnum, MealChoiceEnum


class AdminRsvpEntryFilter(str, Enum):
    all = "all"
    special_diet = "special_diet"
    children = "children"


class AdminRsvpGuestDetail(BaseModel):
    first_name: str
    last_name: str
    meal_choice: MealChoiceEnum
    intolerance: IntoleranceEnum
    dietary_notes: Optional[str] = None
    is_child: bool


class AdminRsvpEntry(BaseModel):
    user_id: int
    rsvp_id: int
    faction: Optional[FactionEnum] = None
    has_special_diet: bool
    has_child: bool
    guest_count: int
    account_holder: AdminRsvpGuestDetail
    companions: list[AdminRsvpGuestDetail] = []
    # Manually set by an admin — see PATCH /admin/rsvp/{rsvp_id}/table. No
    # auto-assignment, so these are null until someone picks a table.
    table_id: Optional[int] = None
    table_label: Optional[str] = None


class AdminRsvpEntriesResponse(BaseModel):
    items: list[AdminRsvpEntry]
    total: int
    page: int
    page_size: int
