from sqlalchemy import Column, DateTime, Integer, String

from database.base import Base


# Stores application users that can log in and keep a persisted session.
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    # Nullable: guest accounts created via the WhatsApp invite flow have
    # neither an email nor a password (see services/guest_access_service.py)
    # — the invite token is their only credential. Only admin accounts,
    # seeded directly via scripts/seed_admin_users.py, set both.
    email = Column(String(160), unique=True, index=True, nullable=True)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="user", index=True)
    created_at = Column(DateTime, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
