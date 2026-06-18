from datetime import datetime
from pathlib import Path
import re
from typing import Any
from urllib.parse import quote
from uuid import uuid4

import boto3
from sqlalchemy.orm import Session

from models.photo_album_item_model import PhotoAlbumItem
from models.user_model import User
from schemas.photo_album_schema import (
    PhotoAlbumStatusEnum,
    PhotoUploadCompleteRequest,
    PhotoUploadIntentRequest,
)
from services.rsvp_service import format_user_full_name
from settings import (
    read_photo_max_upload_bytes,
    read_photo_upload_expiration_seconds,
    read_s3_access_key_id,
    read_s3_bucket_name,
    read_s3_endpoint_url,
    read_s3_public_base_url,
    read_s3_region,
    read_s3_secret_access_key,
)

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

FALLBACK_EXTENSION_BY_MIME_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


class PhotoAlbumNotFoundError(Exception):
    """Raised when a photo does not exist."""


class PhotoAlbumValidationError(Exception):
    """Raised for invalid upload metadata."""


class PhotoAlbumConfigError(Exception):
    """Raised when photo storage configuration is incomplete."""


def _validate_photo_metadata(mime_type: str, file_size_bytes: int):
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise PhotoAlbumValidationError("Unsupported image format.")

    max_upload_bytes = read_photo_max_upload_bytes()
    if file_size_bytes > max_upload_bytes:
        raise PhotoAlbumValidationError(
            f"Image is too large. Maximum allowed size is {max_upload_bytes} bytes."
        )


def _ensure_storage_configuration():
    missing_keys = []
    if not read_s3_bucket_name():
        missing_keys.append("S3_BUCKET_NAME")
    if not read_s3_access_key_id():
        missing_keys.append("S3_ACCESS_KEY_ID")
    if not read_s3_secret_access_key():
        missing_keys.append("S3_SECRET_ACCESS_KEY")

    if missing_keys:
        raise PhotoAlbumConfigError(
            f"Photo storage is not configured. Missing: {', '.join(missing_keys)}."
        )


def _build_s3_client():
    client_kwargs: dict[str, Any] = {
        "service_name": "s3",
        "region_name": read_s3_region(),
        "aws_access_key_id": read_s3_access_key_id(),
        "aws_secret_access_key": read_s3_secret_access_key(),
    }
    endpoint_url = read_s3_endpoint_url()
    if endpoint_url:
        client_kwargs["endpoint_url"] = endpoint_url
    return boto3.client(**client_kwargs)


def _sanitize_filename_for_key(original_filename: str, mime_type: str) -> str:
    original_path = Path(original_filename)
    safe_stem = re.sub(r"[^a-z0-9]+", "-", original_path.stem.lower()).strip("-") or "photo"
    extension = original_path.suffix.lower()
    if not extension:
        extension = FALLBACK_EXTENSION_BY_MIME_TYPE.get(mime_type, ".jpg")
    return f"{safe_stem[:40]}{extension}"


def build_photo_storage_key(user_id: int, original_filename: str, mime_type: str) -> str:
    sanitized_filename = _sanitize_filename_for_key(original_filename, mime_type)
    return f"wedding-album/{user_id}/{uuid4().hex}-{sanitized_filename}"


def build_photo_public_url(storage_key: str) -> str:
    quoted_key = quote(storage_key, safe="/")
    public_base_url = read_s3_public_base_url()
    if public_base_url:
        return f"{public_base_url}/{quoted_key}"

    endpoint_url = read_s3_endpoint_url()
    bucket_name = read_s3_bucket_name()
    if endpoint_url:
        return f"{endpoint_url.rstrip('/')}/{bucket_name}/{quoted_key}"

    return f"https://{bucket_name}.s3.{read_s3_region()}.amazonaws.com/{quoted_key}"


def _serialize_admin_photo_item(photo: PhotoAlbumItem, user: User) -> dict[str, Any]:
    return {
        "id": photo.id,
        "user_id": user.id,
        "uploader_name": format_user_full_name(user),
        "storage_key": photo.storage_key,
        "original_filename": photo.original_filename,
        "mime_type": photo.mime_type,
        "caption": photo.caption,
        "status": photo.status,
        "image_url": build_photo_public_url(photo.storage_key),
        "file_size_bytes": photo.file_size_bytes,
        "uploaded_at": photo.uploaded_at,
        "approved_at": photo.approved_at,
    }


def create_photo_upload_intent(
    db: Session,
    current_user: User,
    payload: PhotoUploadIntentRequest,
) -> dict[str, Any]:
    _ = db
    _ensure_storage_configuration()
    _validate_photo_metadata(payload.mime_type, payload.file_size_bytes)

    storage_key = build_photo_storage_key(
        current_user.id,
        payload.original_filename,
        payload.mime_type,
    )
    expires_in_seconds = read_photo_upload_expiration_seconds()
    upload_url = _build_s3_client().generate_presigned_url(
        "put_object",
        Params={
            "Bucket": read_s3_bucket_name(),
            "Key": storage_key,
            "ContentType": payload.mime_type,
        },
        ExpiresIn=expires_in_seconds,
        HttpMethod="PUT",
    )

    return {
        "storage_key": storage_key,
        "upload_url": upload_url,
        "upload_method": "PUT",
        "upload_headers": {"Content-Type": payload.mime_type},
        "max_file_size_bytes": read_photo_max_upload_bytes(),
        "expires_in_seconds": expires_in_seconds,
    }


def register_completed_photo_upload(
    db: Session,
    current_user: User,
    payload: PhotoUploadCompleteRequest,
) -> PhotoAlbumItem:
    _validate_photo_metadata(payload.mime_type, payload.file_size_bytes)
    expected_prefix = f"wedding-album/{current_user.id}/"
    if not payload.storage_key.startswith(expected_prefix):
        raise PhotoAlbumValidationError("Storage key does not belong to this user.")

    existing = db.query(PhotoAlbumItem).filter(PhotoAlbumItem.storage_key == payload.storage_key).first()
    if existing:
        raise PhotoAlbumValidationError("This upload was already registered.")

    photo_item = PhotoAlbumItem(
        user_id=current_user.id,
        storage_key=payload.storage_key,
        original_filename=payload.original_filename,
        mime_type=payload.mime_type,
        caption=payload.caption,
        status=PhotoAlbumStatusEnum.pending.value,
        file_size_bytes=payload.file_size_bytes,
        uploaded_at=datetime.utcnow(),
        approved_at=None,
    )
    db.add(photo_item)
    db.commit()
    db.refresh(photo_item)
    return photo_item


def list_public_photo_album_items(db: Session) -> list[dict[str, Any]]:
    photo_rows = (
        db.query(PhotoAlbumItem, User)
        .join(User, User.id == PhotoAlbumItem.user_id)
        .filter(PhotoAlbumItem.status == PhotoAlbumStatusEnum.approved.value)
        .order_by(PhotoAlbumItem.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": photo.id,
            "uploader_name": format_user_full_name(user),
            "caption": photo.caption,
            "image_url": build_photo_public_url(photo.storage_key),
            "uploaded_at": photo.uploaded_at,
        }
        for photo, user in photo_rows
    ]


def list_admin_photo_album_items(db: Session) -> list[dict[str, Any]]:
    photo_rows = (
        db.query(PhotoAlbumItem, User)
        .join(User, User.id == PhotoAlbumItem.user_id)
        .order_by(PhotoAlbumItem.uploaded_at.desc())
        .all()
    )
    return [_serialize_admin_photo_item(photo, user) for photo, user in photo_rows]


def update_photo_status(
    db: Session,
    photo_id: int,
    status: PhotoAlbumStatusEnum,
) -> dict[str, Any]:
    photo_row = (
        db.query(PhotoAlbumItem, User)
        .join(User, User.id == PhotoAlbumItem.user_id)
        .filter(PhotoAlbumItem.id == photo_id)
        .first()
    )
    if not photo_row:
        raise PhotoAlbumNotFoundError("Photo not found")

    photo_item, user = photo_row
    photo_item.status = status.value
    photo_item.approved_at = datetime.utcnow() if status == PhotoAlbumStatusEnum.approved else None
    db.commit()
    db.refresh(photo_item)
    return _serialize_admin_photo_item(photo_item, user)
