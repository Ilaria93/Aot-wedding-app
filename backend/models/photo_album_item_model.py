from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.base import Base


# Stores one uploaded wedding photo visible in the public album.
class PhotoAlbumItem(Base):
    __tablename__ = "photo_album_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    storage_key = Column(String(255), unique=True, nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(80), nullable=False)
    caption = Column(String(250), nullable=True)
    status = Column(String(20), nullable=False, default="approved", index=True)
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, nullable=False)
    approved_at = Column(DateTime, nullable=True)
