from typing import Optional

from sqlalchemy.orm import Session, joinedload

from models.rsvp_guest_model import RsvpGuest
from models.rsvp_model import RSVP
from schemas.admin_rsvp_entries_schema import (
    AdminRsvpEntry,
    AdminRsvpEntriesResponse,
    AdminRsvpEntryFilter,
    AdminRsvpGuestDetail,
)
from schemas.rsvp_enums import IntoleranceEnum, MealChoiceEnum


def _is_special_diet(guest: RsvpGuest) -> bool:
    return guest.intolerance != IntoleranceEnum.none.value or guest.meal_choice != MealChoiceEnum.standard.value


def _guest_detail(guest: RsvpGuest) -> AdminRsvpGuestDetail:
    return AdminRsvpGuestDetail(
        first_name=guest.first_name,
        last_name=guest.last_name,
        meal_choice=MealChoiceEnum(guest.meal_choice),
        intolerance=IntoleranceEnum(guest.intolerance),
        dietary_notes=guest.dietary_notes,
        is_child=guest.is_child,
    )


def _matches_search(rsvp: RSVP, needle: str) -> bool:
    haystacks = []
    for guest in rsvp.guests:
        haystacks.append(f"{guest.first_name} {guest.last_name}")
        if guest.dietary_notes:
            haystacks.append(guest.dietary_notes)
    return any(needle in haystack.lower() for haystack in haystacks)


def _to_entry(rsvp: RSVP) -> AdminRsvpEntry:
    guests = list(rsvp.guests)
    account_holder, *companions = guests
    return AdminRsvpEntry(
        user_id=rsvp.user_id,
        rsvp_id=rsvp.id,
        faction=rsvp.faction,
        has_special_diet=any(_is_special_diet(guest) for guest in guests),
        has_child=any(guest.is_child for guest in guests),
        guest_count=len(guests),
        account_holder=_guest_detail(account_holder),
        companions=[_guest_detail(guest) for guest in companions],
        table_id=rsvp.table_id,
        table_label=rsvp.table.label if rsvp.table else None,
    )


# Confirmed-guests dashboard: every attending RSVP with full per-guest detail
# (names, meal choices, intolerances, child flag) — the admin list at
# /admin/users only has aggregate attending/faction, not this. The guest list
# is small enough (a wedding, not a stadium) that filtering/search in Python
# after one query is simpler and plenty fast.
def list_confirmed_rsvp_entries(
    db: Session,
    search: Optional[str] = None,
    entry_filter: AdminRsvpEntryFilter = AdminRsvpEntryFilter.all,
    page: int = 1,
    page_size: int = 8,
) -> AdminRsvpEntriesResponse:
    rsvps = (
        db.query(RSVP)
        .options(joinedload(RSVP.guests), joinedload(RSVP.table))
        .filter(RSVP.attending.is_(True))
        .order_by(RSVP.id)
        .all()
    )
    entries = [_to_entry(rsvp) for rsvp in rsvps]

    if entry_filter == AdminRsvpEntryFilter.special_diet:
        entries = [entry for entry in entries if entry.has_special_diet]
    elif entry_filter == AdminRsvpEntryFilter.children:
        entries = [entry for entry in entries if entry.has_child]

    normalized_search = search.strip().lower() if search else ""
    if normalized_search:
        rsvp_by_user_id = {rsvp.user_id: rsvp for rsvp in rsvps}
        entries = [
            entry
            for entry in entries
            if _matches_search(rsvp_by_user_id[entry.user_id], normalized_search)
        ]

    total = len(entries)
    start = (max(page, 1) - 1) * page_size
    page_items = entries[start : start + page_size]

    return AdminRsvpEntriesResponse(items=page_items, total=total, page=page, page_size=page_size)
