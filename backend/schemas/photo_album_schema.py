from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class PhotoAlbumStatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class PhotoUploadIntentRequest(BaseModel):
    original_filename: str
    mime_type: str
    file_size_bytes: int

    @field_validator("original_filename", "mime_type")
    @classmethod
    def validate_non_empty_strings(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be empty.")
        return normalized

    @field_validator("file_size_bytes")
    @classmethod
    def validate_positive_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("file_size_bytes must be greater than zero.")
        return value


class PhotoUploadIntentResponse(BaseModel):
    storage_key: str
    upload_url: str
    upload_method: str
    upload_headers: dict[str, str]
    max_file_size_bytes: int
    expires_in_seconds: int


class PhotoUploadCompleteRequest(BaseModel):
    storage_key: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    caption: Optional[str] = None

    @field_validator("storage_key", "original_filename", "mime_type")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be empty.")
        return normalized

    @field_validator("caption")
    @classmethod
    def normalize_caption(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("file_size_bytes")
    @classmethod
    def validate_completed_positive_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("file_size_bytes must be greater than zero.")
        return value


class PhotoUploadCompleteResponse(BaseModel):
    ok: bool
    photo_id: int
    status: PhotoAlbumStatusEnum


class PublicPhotoAlbumItem(BaseModel):
    id: int
    uploader_name: str
    caption: Optional[str] = None
    image_url: str
    uploaded_at: datetime


class AdminPhotoAlbumItem(BaseModel):
    id: int
    user_id: int
    uploader_name: str
    storage_key: str
    original_filename: str
    mime_type: str
    caption: Optional[str] = None
    status: PhotoAlbumStatusEnum
    image_url: str
    file_size_bytes: int
    uploaded_at: datetime
    approved_at: Optional[datetime] = None


class AdminPhotoStatusUpdateRequest(BaseModel):
    status: PhotoAlbumStatusEnum


class PhotoAlbumItemRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    storage_key: str
    original_filename: str
    mime_type: str
    caption: Optional[str] = None
    status: PhotoAlbumStatusEnum
    file_size_bytes: int
    uploaded_at: datetime
    approved_at: Optional[datetime] = None
