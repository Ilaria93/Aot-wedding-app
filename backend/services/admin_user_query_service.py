from sqlalchemy.orm import Session

from models.rsvp_model import RSVP
from models.user_model import User


def get_all_users_with_rsvp_status(db: Session) -> list[dict]:
    users = db.query(User).order_by(User.last_name, User.first_name).all()
    result = []
    for user in users:
        rsvp = db.query(RSVP).filter(RSVP.user_id == user.id).first()
        result.append(
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role,
                "has_rsvp": rsvp is not None,
                "attending": rsvp.attending if rsvp else None,
                "faction": (rsvp.faction or None) if rsvp else None,
            }
        )
    return result
