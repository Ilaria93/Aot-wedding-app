from sqlalchemy import Boolean, Column, Integer, String

from database.base import Base


# Stores one admin-managed travel or logistics contact entry.
class LogisticsContact(Base):
    __tablename__ = "logistics_contacts"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(40), nullable=False, index=True)
    label = Column(String(120), nullable=False)
    contact_person = Column(String(120), nullable=True)
    phone = Column(String(80), nullable=True)
    whatsapp_phone = Column(String(80), nullable=True)
    email = Column(String(120), nullable=True)
    website = Column(String(255), nullable=True)
    instagram_url = Column(String(255), nullable=True)
    facebook_url = Column(String(255), nullable=True)
    tiktok_url = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(String(300), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
