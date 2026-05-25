from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_current_user
from schemas.photo_album_schema import (
    PhotoUploadCompleteRequest,
    PhotoUploadCompleteResponse,
    PhotoUploadIntentRequest,
    PhotoUploadIntentResponse,
    PublicPhotoAlbumItem,
)
from services.photo_album_service import (
    PhotoAlbumConfigError,
    PhotoAlbumNotFoundError,
    PhotoAlbumValidationError,
    create_photo_upload_intent,
    list_public_photo_album_items,
    register_completed_photo_upload,
)

router = APIRouter(prefix="/photos")


# Returns only approved photos for the public wedding album.
@router.get("", response_model=list[PublicPhotoAlbumItem])
def list_public_photos(db: Session = Depends(get_db)):
    return list_public_photo_album_items(db)


# Builds a signed upload target for a guest-selected image.
@router.post("/upload-intent", response_model=PhotoUploadIntentResponse)
def create_guest_photo_upload_intent(
    payload: PhotoUploadIntentRequest,
    db: Session = Depends(get_db),
    _current_user=Depends(require_current_user),
):
    try:
        return create_photo_upload_intent(db, payload)
    except PhotoAlbumNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PhotoAlbumValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except PhotoAlbumConfigError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


# Persists metadata after a direct client-to-storage upload succeeds.
@router.post("/complete-upload", response_model=PhotoUploadCompleteResponse)
def complete_guest_photo_upload(
    payload: PhotoUploadCompleteRequest,
    db: Session = Depends(get_db),
    _current_user=Depends(require_current_user),
):
    try:
        created_photo = register_completed_photo_upload(db, payload)
    except PhotoAlbumNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except PhotoAlbumValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return PhotoUploadCompleteResponse(
        ok=True,
        photo_id=created_photo.id,
        status=created_photo.status,
    )
