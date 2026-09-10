from datetime import datetime
from pathlib import Path
import re
from typing import Any, Optional
from urllib.parse import quote
from uuid import uuid4

import boto3
from sqlalchemy.orm import Session

from sqlalchemy import func

from models.photo_album_item_model import PhotoAlbumItem
from models.user_model import User
from schemas.photo_album_schema import (
    PhotoAlbumStatusEnum,
    PhotoTagEnum,
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
    read_video_max_upload_bytes,
)

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
}

ALLOWED_MEDIA_MIME_TYPES = ALLOWED_IMAGE_MIME_TYPES | ALLOWED_VIDEO_MIME_TYPES

FALLBACK_EXTENSION_BY_MIME_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
}


def is_video_mime_type(mime_type: str) -> bool:
    return mime_type in ALLOWED_VIDEO_MIME_TYPES


class PhotoAlbumNotFoundError(Exception):
    """Raised when a photo does not exist."""


class PhotoAlbumValidationError(Exception):
    """Raised for invalid upload metadata."""


class PhotoAlbumConfigError(Exception):
    """Raised when photo storage configuration is incomplete."""


def _validate_photo_metadata(mime_type: str, file_size_bytes: int):
    if mime_type not in ALLOWED_MEDIA_MIME_TYPES:
        raise PhotoAlbumValidationError("Unsupported media format.")

    max_upload_bytes = read_video_max_upload_bytes() if is_video_mime_type(mime_type) else read_photo_max_upload_bytes()
    if file_size_bytes > max_upload_bytes:
        raise PhotoAlbumValidationError(
            f"File is too large. Maximum allowed size is {max_upload_bytes} bytes."
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


def create_photo_upload_intent(
    current_user: User,
    payload: PhotoUploadIntentRequest,
) -> dict[str, Any]:
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

    uploaded_at = datetime.utcnow()
    photo_item = PhotoAlbumItem(
        user_id=current_user.id,
        storage_key=payload.storage_key,
        original_filename=payload.original_filename,
        mime_type=payload.mime_type,
        caption=payload.caption,
        tag=payload.tag.value if payload.tag else None,
        status=PhotoAlbumStatusEnum.approved.value,
        file_size_bytes=payload.file_size_bytes,
        uploaded_at=uploaded_at,
        approved_at=uploaded_at,
    )
    db.add(photo_item)
    db.commit()
    db.refresh(photo_item)
    return photo_item


def delete_photo_album_item(db: Session, photo_id: int) -> bool:
    """Removes a photo from the album and its S3 object. Returns False if it never existed."""
    photo_item = db.query(PhotoAlbumItem).filter(PhotoAlbumItem.id == photo_id).first()
    if not photo_item:
        return False

    _ensure_storage_configuration()
    _build_s3_client().delete_object(Bucket=read_s3_bucket_name(), Key=photo_item.storage_key)

    db.delete(photo_item)
    db.commit()
    return True


def _to_public_item(photo: PhotoAlbumItem, user: User) -> dict[str, Any]:
    return {
        "id": photo.id,
        "uploader_name": format_user_full_name(user),
        "caption": photo.caption,
        "image_url": build_photo_public_url(photo.storage_key),
        "mime_type": photo.mime_type,
        "tag": photo.tag,
        "is_favorite": photo.is_favorite,
        "uploaded_at": photo.uploaded_at,
    }


def list_public_photo_album_items(db: Session) -> list[dict[str, Any]]:
    photo_rows = (
        db.query(PhotoAlbumItem, User)
        .join(User, User.id == PhotoAlbumItem.user_id)
        .order_by(PhotoAlbumItem.uploaded_at.desc())
        .all()
    )
    return [_to_public_item(photo, user) for photo, user in photo_rows]


# Admin gallery grid: paginated, filterable by tag, searchable by uploader
# name or caption — same shape as list_confirmed_rsvp_entries's query pattern.
def list_admin_photo_album_items(
    db: Session,
    search: Optional[str] = None,
    tag: Optional[PhotoTagEnum] = None,
    page: int = 1,
    page_size: int = 8,
) -> dict[str, Any]:
    query = db.query(PhotoAlbumItem, User).join(User, User.id == PhotoAlbumItem.user_id)
    if tag is not None:
        query = query.filter(PhotoAlbumItem.tag == tag.value)

    photo_rows = query.order_by(PhotoAlbumItem.uploaded_at.desc()).all()
    items = [_to_public_item(photo, user) for photo, user in photo_rows]

    normalized_search = search.strip().lower() if search else ""
    if normalized_search:
        items = [
            item
            for item in items
            if normalized_search in item["uploader_name"].lower()
            or normalized_search in (item["caption"] or "").lower()
        ]

    total = len(items)
    start = (max(page, 1) - 1) * page_size
    page_items = items[start : start + page_size]

    return {"items": page_items, "total": total, "page": page, "page_size": page_size}


def set_photo_favorite(db: Session, photo_id: int, is_favorite: bool) -> Optional[dict[str, Any]]:
    return update_admin_photo(db, photo_id, {"is_favorite": is_favorite})


# Partial update — only fields present in update_fields are touched, so a
# favorite toggle (is_favorite only) never clobbers an unrelated caption/tag
# edit, and vice versa. Pair with AdminPhotoUpdateRequest.model_dump(exclude_unset=True).
def update_admin_photo(db: Session, photo_id: int, update_fields: dict[str, Any]) -> Optional[dict[str, Any]]:
    row = (
        db.query(PhotoAlbumItem, User)
        .join(User, User.id == PhotoAlbumItem.user_id)
        .filter(PhotoAlbumItem.id == photo_id)
        .first()
    )
    if not row:
        return None

    photo_item, user = row
    if "is_favorite" in update_fields:
        photo_item.is_favorite = update_fields["is_favorite"]
    if "caption" in update_fields:
        photo_item.caption = update_fields["caption"]
    if "tag" in update_fields:
        tag_value = update_fields["tag"]
        photo_item.tag = tag_value.value if tag_value else None

    db.commit()
    db.refresh(photo_item)
    return _to_public_item(photo_item, user)


def compute_admin_gallery_stats(db: Session) -> dict[str, Any]:
    video_mime_types = list(ALLOWED_VIDEO_MIME_TYPES)
    total_videos = db.query(func.count(PhotoAlbumItem.id)).filter(PhotoAlbumItem.mime_type.in_(video_mime_types)).scalar() or 0
    total_photos = db.query(func.count(PhotoAlbumItem.id)).filter(PhotoAlbumItem.mime_type.notin_(video_mime_types)).scalar() or 0
    storage_used_bytes = db.query(func.coalesce(func.sum(PhotoAlbumItem.file_size_bytes), 0)).scalar() or 0

    # Only tags actually used by an upload — the filter pills show tags that
    # exist, not the full catalog of possible ones.
    tag_rows = (
        db.query(PhotoAlbumItem.tag, func.count(PhotoAlbumItem.id))
        .filter(PhotoAlbumItem.tag.isnot(None))
        .group_by(PhotoAlbumItem.tag)
        .all()
    )
    tag_counts = {tag: int(count) for tag, count in tag_rows}

    return {
        "total_photos": int(total_photos),
        "total_videos": int(total_videos),
        "storage_used_bytes": int(storage_used_bytes),
        "tag_counts": tag_counts,
    }
