import secrets
from typing import Optional

from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from settings import read_site_url


# Public lookup for the envelope invite page. Returns None for an unknown
# token so the route can answer with a plain 404 (guest-friendly copy lives
# in the frontend, not in this error path).
def get_invite_by_token(db: Session, token: str) -> Optional[InviteLink]:
    return db.query(InviteLink).filter(InviteLink.token == token).first()


TOKEN_BYTES = 12  # secrets.token_urlsafe(12) -> 16 chars, 96 bits of entropy


# Shared by the CLI import script and admin approval of invite requests.
def generate_unique_token(db: Session) -> str:
    for _ in range(5):
        token = secrets.token_urlsafe(TOKEN_BYTES)
        if not db.query(InviteLink).filter(InviteLink.token == token).first():
            return token
    raise RuntimeError("Could not generate a unique token after 5 attempts.")


def build_invite_url(token: str) -> str:
    return f"{read_site_url()}/invito/{token}"
