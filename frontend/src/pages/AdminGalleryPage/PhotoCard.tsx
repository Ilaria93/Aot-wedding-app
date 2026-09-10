import { Eye, Pencil, Star, Trash2 } from 'lucide-react';

import { getPhotoTagIcon, getPhotoTagLabel } from '@/constants/photoTags';
import type { AppLocale, TranslateFn } from '@/i18n/translations';
import { isVideoMimeType, type PublicPhotoAlbumItem } from '@/services/photoAlbumApi';

type PhotoCardProps = {
  photo: PublicPhotoAlbumItem;
  locale: AppLocale;
  t: TranslateFn;
  onToggleFavorite: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  favoriteBusy?: boolean;
  deleteBusy?: boolean;
};

// Same dark-panel/gold-corner language as SupplierCard — one card per guest
// upload. Everything is already public the moment it's uploaded (see
// admin_photo_album_route.py), so admin edits are limited to starring a
// favorite, editing the caption/tag, or deleting it outright.
export function PhotoCard({
  photo,
  locale,
  t,
  onToggleFavorite,
  onPreview,
  onEdit,
  onDelete,
  favoriteBusy,
  deleteBusy,
}: PhotoCardProps) {
  const TagIcon = photo.tag ? getPhotoTagIcon(photo.tag) : null;
  const uploadTime = new Date(photo.uploaded_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <article className="admin-photo-card">
      <div className="admin-photo-card__media">
        {isVideoMimeType(photo.mime_type) ? (
          <video className="admin-photo-card__visual" src={photo.image_url} controls muted />
        ) : (
          <img className="admin-photo-card__visual" src={photo.image_url} alt={photo.caption || photo.uploader_name} />
        )}
        {photo.tag && TagIcon ? (
          <span className="admin-photo-card__tag">
            <TagIcon size={12} aria-hidden />
            {getPhotoTagLabel(photo.tag, t)}
          </span>
        ) : null}
        <span className="admin-photo-card__time">{uploadTime}</span>
      </div>

      <div className="admin-photo-card__body">
        <p className="admin-photo-card__name">{photo.uploader_name}</p>
        {photo.caption ? <p className="admin-photo-card__caption">“{photo.caption}”</p> : null}

        <div className="admin-photo-card__footer">
          <span className="admin-photo-card__status">
            <span className="admin-photo-card__status-dot" aria-hidden />
            {t('admin.photos.statusPublished')}
          </span>
          <div className="admin-photo-card__actions">
            <button
              type="button"
              className={`admin-photo-card__action-btn admin-photo-card__action-btn--favorite${photo.is_favorite ? ' is-active' : ''}`}
              aria-pressed={photo.is_favorite}
              aria-label={photo.is_favorite ? t('admin.photos.unfavoriteButton') : t('admin.photos.favoriteButton')}
              disabled={favoriteBusy}
              onClick={onToggleFavorite}>
              <Star size={14} fill={photo.is_favorite ? 'currentColor' : 'none'} aria-hidden />
            </button>
            <button
              type="button"
              className="admin-photo-card__action-btn"
              aria-label={t('admin.photos.previewButton')}
              onClick={onPreview}>
              <Eye size={14} aria-hidden />
            </button>
            <button
              type="button"
              className="admin-photo-card__action-btn"
              aria-label={t('admin.photos.editButton')}
              onClick={onEdit}>
              <Pencil size={14} aria-hidden />
            </button>
            <button
              type="button"
              className="admin-photo-card__action-btn admin-photo-card__action-btn--delete"
              aria-label={t('admin.photos.delete')}
              disabled={deleteBusy}
              onClick={onDelete}>
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
