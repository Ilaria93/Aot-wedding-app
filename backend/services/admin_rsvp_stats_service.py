from sqlalchemy.orm import Session

from models.guest_model import Guest
from models.rsvp_model import RSVP


# Computes aggregated RSVP statistics from DB.
def compute_rsvp_stats(db: Session) -> dict:
    total_invited = db.query(Guest).count()

    all_rsvps = db.query(RSVP).all()
    total_confirmed = len(all_rsvps)
    total_attending = sum(1 for r in all_rsvps if r.attending)
    total_not_attending = sum(1 for r in all_rsvps if not r.attending)

    by_faction: dict[str, int] = {}
    for rsvp in all_rsvps:
        if rsvp.attending:
            by_faction[rsvp.faction] = by_faction.get(rsvp.faction, 0) + 1

    return {
        "total_invited": total_invited,
        "total_confirmed": total_confirmed,
        "total_attending": total_attending,
        "total_not_attending": total_not_attending,
        "by_faction": by_faction,
    }
