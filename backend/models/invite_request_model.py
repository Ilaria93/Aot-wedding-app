from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


# A guest without their WhatsApp link asks for one from the site; the couple
# approves (which creates or reuses an invite_links row) or rejects it.
class InviteRequest(Base):
    __tablename__ = "invite_requests"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    # E.164, e.g. +393331234567 (services/phone_service.py).
    phone = Column(String(30), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    invite_link_id = Column(Integer, ForeignKey("invite_links.id"), nullable=True)
    created_at = Column(DateTime, nullable=False)
    decided_at = Column(DateTime, nullable=True)

    invite_link = relationship("InviteLink")
