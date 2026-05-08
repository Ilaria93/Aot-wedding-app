from sqlalchemy.orm import Session

from models.guest_model import Guest
from models.rsvp_model import RSVP


# Returns all guests with their RSVP status joined.
def get_all_guests_with_rsvp_status(db: Session) -> list:
    guests = db.query(Guest).all()
    result = []
    for guest in guests:
        rsvp = db.query(RSVP).filter(RSVP.guest_id == guest.id).first()
        result.append({
            "id": guest.id,
            "full_name": guest.full_name,
            "invitation_token": guest.invitation_token,
            "has_rsvp": rsvp is not None,
            "attending": rsvp.attending if rsvp else None,
            "faction": rsvp.faction if rsvp else None,
        })
    return result