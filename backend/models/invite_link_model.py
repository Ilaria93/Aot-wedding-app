from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import backref, relationship

from database.base import Base


# One row per person on the guest list. A head (head_id NULL) is the person who
# receives the WhatsApp invite: only heads have a token. Everyone else is a
# member linked to a head (spouse, partner, child, other) and rides on the
# head's invite. The token drives both the envelope page's greeting and the
# passwordless first RSVP confirmation, which creates the guest's account and
# binds it here (see services/guest_access_service.py).
class InviteLink(Base):
    __tablename__ = "invite_links"

    id = Column(Integer, primary_key=True, index=True)
    # Heads only; NULL for members, who have no link of their own.
    token = Column(String(64), unique=True, index=True, nullable=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    phone = Column(String(30), nullable=True)
    # "m" | "f", only used for the single-person greeting (Caro/Cara).
    gender = Column(String(1), nullable=True)
    # NULL = head. Otherwise the head's id (never a member: no chains).
    head_id = Column(Integer, ForeignKey("invite_links.id"), nullable=True, index=True)
    # Relation to the head: "spouse" | "partner" | "child" | "other". NULL for heads.
    relation = Column(String(10), nullable=True)
    # Heads only: overrides the head's last name in "Cara famiglia {family_name}".
    family_name = Column(String(80), nullable=True)
    # Expected number of people in this guest's party — pre-fills the RSVP
    # form's max guest count instead of the site-wide default (see
    # routes/invite_link_route.py). Optional: falls back to that default
    # when not provided at import time.
    party_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    # When the admin opened the WhatsApp send for this invite (admin "Inviti" page).
    sent_at = Column(DateTime, nullable=True)
    # Set the first time this invite's guest confirms/recovers access — lets
    # a repeat visit reuse the same guest User instead of creating another.
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True, index=True)

    user = relationship("User")
    members = relationship(
        "InviteLink",
        backref=backref("head", remote_side=[id]),
        order_by="InviteLink.id",
    )
