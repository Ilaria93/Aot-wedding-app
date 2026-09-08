from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from services.photo_album_service import delete_photo_album_item

router = APIRouter(prefix="/admin/photos")


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
