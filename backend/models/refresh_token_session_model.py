from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from database.base import Base


# Stores one refresh token session so logout and rotation can be enforced.
class RefreshTokenSession(Base):
    __tablename__ = "refresh_token_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    jti = Column(String(64), unique=True, nullable=False, index=True)
    refresh_token_hash = Column(String(128), nullable=False)
    remember_me = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True)
