from typing import Optional

from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink


# Public lookup for the envelope invite page. Returns None for an unknown
# token so the route can answer with a plain 404 (guest-friendly copy lives
# in the frontend, not in this error path).
def get_invite_by_token(db: Session, token: str) -> Optional[InviteLink]:
    return db.query(InviteLink).filter(InviteLink.token == token).first()
