from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


# Stores one RSVP response per authenticated user.
class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    attending = Column(Boolean, nullable=False)
    faction = Column(String(50), nullable=True)

    guests = relationship(
        "RsvpGuest",
        back_populates="rsvp",
        cascade="all, delete-orphan",
        order_by="RsvpGuest.sort_order",
    )
