from typing import Dict, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from constants.rsvp_party import FACTION_IDS
from models.rsvp_guest_model import RsvpGuest
from models.rsvp_model import RSVP


def count_attending_guests_by_faction(db: Session, exclude_rsvp_id: Optional[int] = None) -> Dict[str, int]:
    """Returns headcount per faction for attending parties (one count per guest row)."""
    query = (
        db.query(RSVP.faction, func.count(RsvpGuest.id))
        .join(RsvpGuest, RsvpGuest.rsvp_id == RSVP.id)
        .filter(RSVP.attending.is_(True), RSVP.faction.isnot(None))
        .group_by(RSVP.faction)
    )
    if exclude_rsvp_id is not None:
        query = query.filter(RSVP.id != exclude_rsvp_id)

    counts = {faction_id: 0 for faction_id in FACTION_IDS}
    for faction, total in query.all():
        if faction in counts:
            counts[faction] = int(total)
    return counts


def pick_balanced_faction(db: Session, exclude_rsvp_id: Optional[int] = None) -> str:
    """Assigns the faction with the lowest guest count; tie-break follows FACTION_IDS order."""
    counts = count_attending_guests_by_faction(db, exclude_rsvp_id=exclude_rsvp_id)
    min_count = min(counts.values())
    for faction_id in FACTION_IDS:
        if counts[faction_id] == min_count:
            return faction_id
    return FACTION_IDS[0]
