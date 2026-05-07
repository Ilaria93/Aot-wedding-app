from sqlalchemy import Column, Integer, String

from database.base import Base


# Stores invited guest identity and token.
class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    invitation_token = Column(String(64), unique=True, index=True, nullable=False)
