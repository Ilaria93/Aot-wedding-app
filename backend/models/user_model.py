from sqlalchemy import Column, DateTime, Integer, String

from database.base import Base


# Stores application users that can log in and keep a persisted session.
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(160), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user", index=True)
    created_at = Column(DateTime, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
