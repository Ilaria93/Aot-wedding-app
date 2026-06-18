from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from database.base import Base


# Stores one RSVP response per authenticated user.
class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    attending = Column(Boolean, nullable=False)
    faction = Column(String(50), nullable=False, default="")
    dietary_notes = Column(String(250), nullable=True)
