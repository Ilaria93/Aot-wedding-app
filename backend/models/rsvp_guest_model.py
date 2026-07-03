from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


# One row per participant in an RSVP party (max 10 per RSVP).
class RsvpGuest(Base):
    __tablename__ = "rsvp_guests"

    id = Column(Integer, primary_key=True, index=True)
    rsvp_id = Column(Integer, ForeignKey("rsvps.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    meal_choice = Column(String(30), nullable=False)
    intolerance = Column(String(30), nullable=False)
    dietary_notes = Column(String(250), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    rsvp = relationship("RSVP", back_populates="guests")
