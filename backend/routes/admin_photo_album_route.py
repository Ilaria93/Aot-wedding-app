from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.photo_album_schema import (
    AdminGalleryStatsResponse,
    AdminPhotoListResponse,
    AdminPhotoUpdateRequest,
    PhotoTagEnum,
    PublicPhotoAlbumItem,
)
from services.photo_album_service import (
    compute_admin_gallery_stats,
    delete_photo_album_item,
    list_admin_photo_album_items,
    update_admin_photo,
)

router = APIRouter(prefix="/admin/photos")


# Photo/video counts and total storage used — feeds the gallery admin dashboard.
@router.get("/stats", response_model=AdminGalleryStatsResponse)
def get_admin_gallery_stats(
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return compute_admin_gallery_stats(db)


# Paginated gallery grid — searchable by uploader/caption, filterable by tag.
@router.get("", response_model=AdminPhotoListResponse)
def list_admin_photos(
    search: Optional[str] = Query(default=None),
    tag: Optional[PhotoTagEnum] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return list_admin_photo_album_items(db, search=search, tag=tag, page=page, page_size=page_size)


# Partial update: toggle favorite and/or edit caption/tag — only fields
# present in the request body are changed (see update_admin_photo).
@router.patch("/{photo_id}", response_model=PublicPhotoAlbumItem)
def patch_admin_photo(
    photo_id: int,
    payload: AdminPhotoUpdateRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    updated_item = update_admin_photo(db, photo_id, payload.model_dump(exclude_unset=True))
    if not updated_item:
        raise HTTPException(status_code=404, detail="Photo not found")
    return updated_item


# Removes an inappropriate or unwanted photo from the album and its storage.
# Post-moderation only — every upload is already public, this just takes one down.
@router.delete("/{photo_id}", status_code=204)
def delete_admin_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    if not delete_photo_album_item(db, photo_id):
        raise HTTPException(status_code=404, detail="Photo not found")
    return Response(status_code=204)
