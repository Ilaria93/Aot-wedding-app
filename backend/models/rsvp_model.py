from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from database.base import Base


# Stores RSVP response linked to one guest.
class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id"), unique=True, nullable=False)
    attending = Column(Boolean, nullable=False)
    # Stores empty string for non-attending guests to stay compatible with existing local DBs.
    faction = Column(String(50), nullable=False, default="")
    dietary_notes = Column(String(250), nullable=True)
