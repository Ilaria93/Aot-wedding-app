from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.admin_auth_dependency import require_admin_api_key
from schemas.photo_album_schema import AdminPhotoAlbumItem, AdminPhotoStatusUpdateRequest
from services.photo_album_service import (
    PhotoAlbumNotFoundError,
    list_admin_photo_album_items,
    update_photo_status,
)

router = APIRouter(prefix="/admin/photos")


# Returns all uploaded photos so admin can review moderation status.
@router.get("", response_model=list[AdminPhotoAlbumItem])
def list_admin_photos(
    db: Session = Depends(get_db),
    _admin_ok: None = Depends(require_admin_api_key),
):
    return list_admin_photo_album_items(db)


# Updates moderation status for one uploaded photo.
@router.patch("/{photo_id}", response_model=AdminPhotoAlbumItem)
def update_admin_photo_status(
    photo_id: int,
    payload: AdminPhotoStatusUpdateRequest,
    db: Session = Depends(get_db),
    _admin_ok: None = Depends(require_admin_api_key),
):
    try:
        update_photo_status(db, photo_id, payload.status)
    except PhotoAlbumNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    for photo_item in list_admin_photo_album_items(db):
        if photo_item["id"] == photo_id:
            return photo_item

    raise HTTPException(status_code=404, detail="Photo not found")
