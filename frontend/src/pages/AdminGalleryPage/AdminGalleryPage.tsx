import { Archive, Check, CloudCog, History, Image, PlayCircle, Plus, Rss, Video, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { AdminModal } from '@/components/AdminModal';
import { AlbumUploadPanel } from '@/components/Album/AlbumUploadPanel';
import { FilterPills, type FilterPillOption } from '@/components/FilterPills';
import { PageAlert } from '@/components/PageShell';
import { Pagination } from '@/components/Pagination';
import { SearchBar } from '@/components/SearchBar';
import { StatCards, type StatCardData } from '@/components/StatCards';
import { getPhotoTagIcon, getPhotoTagLabel, PHOTO_TAG_IDS } from '@/constants/photoTags';
import { useI18n } from '@/contexts/I18nContext';
import type { AppLocale, TranslateFn } from '@/i18n/translations';
import { useAdminHeroStatsSlot } from '@/layouts/AdminLayout/AdminHeroStatsSlotContext';
import { getApiErrorMessage } from '@/services/apiErrors';
import {
  deleteAdminPhoto,
  fetchAdminGalleryStats,
  fetchAdminPhotoList,
  isVideoMimeType,
  updateAdminPhoto,
  updatePhotoFavorite,
  type AdminGalleryStats,
  type PhotoTagId,
  type PublicPhotoAlbumItem,
} from '@/services/photoAlbumApi';
import { PhotoCard } from './PhotoCard';
import './styles/AdminGalleryPage.scss';

const STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 * 1024;
const MAX_ROWS_PER_PAGE = 2;

// Mirrors AdminGalleryPage.scss's .admin-gallery__grid breakpoints so the
// fetched page size always fills exactly MAX_ROWS_PER_PAGE rows on screen.
function getGridColumns(): number {
  if (typeof window === 'undefined') return 2;
  if (window.matchMedia('(min-width: 1024px)').matches) return 4;
  if (window.matchMedia('(min-width: 640px)').matches) return 3;
  return 2;
}

// Same card shape as AdminRsvpPage's buildStatCards — photo/video counts and
// storage used, no head indicator (matches the reference mockup).
function buildGalleryStatCards(stats: AdminGalleryStats, t: TranslateFn): StatCardData[] {
  const storageUsedGb = stats.storage_used_bytes / (1024 * 1024 * 1024);
  const storagePercent = (stats.storage_used_bytes / STORAGE_QUOTA_BYTES) * 100;

  return [
    {
      id: 'photos',
      tone: 'gold',
      label: t('admin.photos.statsPhotosLabel'),
      value: stats.total_photos,
      valueIcon: Image,
      subtitle: t('admin.photos.statsPhotosSubtitle'),
      hideIndicator: true,
    },
    {
      id: 'videos',
      tone: 'gold',
      label: t('admin.photos.statsVideosLabel'),
      value: stats.total_videos,
      valueIcon: Video,
      subtitle: t('admin.photos.statsVideosSubtitle'),
      hideIndicator: true,
    },
    {
      id: 'storage',
      tone: 'bone',
      label: t('admin.photos.statsStorageLabel'),
      value: Math.round(storageUsedGb * 10) / 10,
      unit: t('admin.photos.statsStorageUnit'),
      progress: storagePercent,
      hideIndicator: true,
    },
  ];
}

// "2 minuti fa" / "2 minutes ago" — locale-aware via the native Intl API.
function formatRelativeUpload(dateIso: string, locale: AppLocale): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMinutes = Math.round((new Date(dateIso).getTime() - Date.now()) / 60000);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffHours / 24), 'day');
}

// Pure derivation, same pattern as GallerySection's toGalleryViewState — one
// skeleton grid covers both "still fetching" and "fetch confirmed empty", so
// there's no separate "no photos" text state to fall into by mistake.
export function shouldShowPlaceholders(gridLoading: boolean, photoCount: number): boolean {
  return gridLoading || photoCount === 0;
}

// Doubles as the empty-state placeholder (see shouldShowPlaceholders) —
// animated while actually fetching, static once a fetch confirms there's nothing.
function PhotoCardSkeleton({ animate }: { animate: boolean }) {
  return (
    <div className="admin-photo-card admin-photo-card--skeleton">
      <Skeleton className="admin-photo-card__skeleton-media" enableAnimation={animate} />
      <div className="admin-photo-card__body">
        <Skeleton width="60%" height={16} enableAnimation={animate} />
        <Skeleton width="90%" height={12} style={{ marginTop: 8 }} enableAnimation={animate} />
        <Skeleton width="40%" height={20} style={{ marginTop: 14 }} enableAnimation={animate} />
      </div>
    </div>
  );
}

/** Admin section — every uploaded photo, groupable by moment tag, paginated. */
export function AdminGalleryPage() {
  const { locale, t } = useI18n();
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AdminGalleryStats | null>(null);
  const [gridLoading, setGridLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<PhotoTagId | 'all'>('all');
  const [page, setPage] = useState(1);
  const [previewPhoto, setPreviewPhoto] = useState<PublicPhotoAlbumItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PublicPhotoAlbumItem | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editTag, setEditTag] = useState<PhotoTagId | ''>('');
  const [editSaving, setEditSaving] = useState(false);
  const [liveApproval, setLiveApproval] = useState(false);
  const [gridColumns, setGridColumns] = useState(getGridColumns);
  const heroStatsSlot = useAdminHeroStatsSlot();
  const pageSize = gridColumns * MAX_ROWS_PER_PAGE;

  useEffect(() => {
    const mediaQueries = ['(min-width: 640px)', '(min-width: 1024px)'].map((query) => window.matchMedia(query));
    const handleChange = () => {
      setGridColumns(getGridColumns());
      setPage(1);
    };
    mediaQueries.forEach((mq) => mq.addEventListener('change', handleChange));
    return () => mediaQueries.forEach((mq) => mq.removeEventListener('change', handleChange));
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchAdminGalleryStats());
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.photos.loadFailed')));
    }
  }, [t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      setGridLoading(true);
      fetchAdminPhotoList({
        search,
        tag: tagFilter === 'all' ? undefined : tagFilter,
        page,
        pageSize,
      })
        .then((response) => {
          if (!active) return;
          setError(null);
          setPhotos(response.items);
          setTotal(response.total);
        })
        .catch((caughtError) => {
          if (!active) return;
          setError(getApiErrorMessage(caughtError, t('admin.photos.loadFailed')));
        })
        .finally(() => {
          if (!active) return;
          setGridLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [search, tagFilter, page, pageSize, t]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTagChange(nextTag: PhotoTagId | 'all') {
    setTagFilter(nextTag);
    setPage(1);
  }

  async function refreshAfterMutation() {
    await Promise.all([
      loadStats(),
      fetchAdminPhotoList({
        search,
        tag: tagFilter === 'all' ? undefined : tagFilter,
        page,
        pageSize,
      }).then((response) => {
        setPhotos(response.items);
        setTotal(response.total);
      }),
    ]);
  }

  async function handleDelete(photo: PublicPhotoAlbumItem) {
    if (!window.confirm(t('admin.photos.confirmDelete'))) {
      return;
    }

    try {
      setDeletingId(photo.id);
      await deleteAdminPhoto(photo.id);
      await refreshAfterMutation();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.photoDeleteFailed')));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleFavorite(photo: PublicPhotoAlbumItem) {
    try {
      setFavoriteBusyId(photo.id);
      const updated = await updatePhotoFavorite(photo.id, !photo.is_favorite);
      setPhotos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.photos.favoriteUpdateFailed')));
    } finally {
      setFavoriteBusyId(null);
    }
  }

  async function handleAddPhotoSuccess() {
    setIsAddModalOpen(false);
    await refreshAfterMutation();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const lastPhoto = photos[0];
  const totalMediaCount = stats ? stats.total_photos + stats.total_videos : 0;

  const tagFilterOptions: FilterPillOption<PhotoTagId | 'all'>[] = useMemo(
    () => [
      { id: 'all', label: t('admin.photos.filterAll', { count: totalMediaCount }) },
      ...PHOTO_TAG_IDS.filter((tagId) => (stats?.tag_counts[tagId] ?? 0) > 0).map((tagId) => ({
        id: tagId,
        label: `${getPhotoTagLabel(tagId, t)} (${stats?.tag_counts[tagId] ?? 0})`,
        icon: getPhotoTagIcon(tagId),
      })),
    ],
    [t, totalMediaCount, stats],
  );

  const statCards = useMemo(() => (stats ? buildGalleryStatCards(stats, t) : []), [stats, t]);
  const showPlaceholders = shouldShowPlaceholders(gridLoading, photos.length);

  return (
    <SkeletonTheme baseColor="var(--obw-charcoal)" highlightColor="color-mix(in srgb, var(--obw-bone) 10%, var(--obw-charcoal))">
      {statCards.length > 0 && heroStatsSlot ? createPortal(<StatCards cards={statCards} />, heroStatsSlot) : null}

      {error ? <PageAlert message={error} /> : null}

      <section className="obw-portal-panel admin-gallery__toolbar">
        <span className="obw-portal-kicker admin-gallery__toolbar-label">{t('admin.photos.searchLabel')}</span>
        <FilterPills options={tagFilterOptions} active={tagFilter} onChange={handleTagChange} />
        <SearchBar value={search} onChange={handleSearchChange} placeholder={t('admin.photos.searchPlaceholder')} />

        <div className="admin-gallery__extra-controls">
          <button
            type="button"
            className={`admin-gallery__live-toggle${liveApproval ? ' is-active' : ''}`}
            aria-pressed={liveApproval}
            onClick={() => setLiveApproval((current) => !current)}>
            <span className={`admin-gallery__live-toggle-box${liveApproval ? ' is-active' : ''}`}>
              {liveApproval ? <Check size={11} aria-hidden /> : null}
            </span>
            <span className="admin-gallery__live-toggle-text">
              <strong>{t('admin.photos.liveApprovalLabel')}</strong>
              <span>{t('admin.photos.liveApprovalSubtitle')}</span>
            </span>
          </button>

          <button type="button" className="admin-gallery__control-btn" disabled title={t('admin.photos.comingSoon')}>
            <Archive size={14} aria-hidden />
            {t('admin.photos.zipArchiveButton')}
          </button>

          <button type="button" className="admin-gallery__control-btn" disabled title={t('admin.photos.comingSoon')}>
            <PlayCircle size={14} aria-hidden />
            {t('admin.photos.liveSlideButton')}
          </button>
        </div>
      </section>

      <div className="admin-gallery__live-banner">
        <span className="admin-gallery__live-banner-icon">
          <Rss size={16} aria-hidden />
        </span>
        <p className="admin-gallery__live-banner-text">
          <strong>{t('admin.photos.liveBannerTitle')}</strong> {t('admin.photos.liveBannerIntro')}{' '}
          {lastPhoto
            ? t('admin.photos.liveBannerLastUpload', {
                time: formatRelativeUpload(lastPhoto.uploaded_at, locale),
                name: lastPhoto.uploader_name,
              })
            : t('admin.photos.liveBannerNoUploads')}
        </p>
        <span className="admin-gallery__live-banner-tag">{t('admin.photos.liveBannerTag')}</span>
      </div>

      <div className="admin-gallery__grid">
        <button type="button" className="admin-photo-card admin-photo-card--add" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={28} aria-hidden />
          <span>{t('admin.photos.addPhotoCardLabel')}</span>
        </button>

        {showPlaceholders
          ? Array.from({ length: pageSize }, (_, index) => <PhotoCardSkeleton key={index} animate={gridLoading} />)
          : photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                locale={locale}
                t={t}
                favoriteBusy={favoriteBusyId === photo.id}
                deleteBusy={deletingId === photo.id}
                onToggleFavorite={() => void handleToggleFavorite(photo)}
                onPreview={() => setPreviewPhoto(photo)}
                onDelete={() => void handleDelete(photo)}
              />
            ))}
      </div>

      {!gridLoading && total > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          label={t('admin.photos.viewingCount', {
            from: (page - 1) * pageSize + 1,
            to: Math.min(page * pageSize, total),
            total,
          })}
          prevLabel={t('admin.photos.prevPage')}
          nextLabel={t('admin.photos.nextPage')}
          onChange={setPage}
        />
      ) : null}

      {stats ? (
        <div className="admin-gallery__live-banner admin-gallery__live-banner--backup">
          <span className="admin-gallery__live-banner-icon">
            <CloudCog size={16} aria-hidden />
          </span>
          <div className="admin-gallery__backup-body">
            <div className="admin-gallery__backup-head">
              <strong>{t('admin.photos.backupBannerTitle')}</strong>
              <span className="admin-gallery__backup-badge">{t('admin.photos.backupBannerBadge')}</span>
            </div>
            <p className="admin-gallery__backup-text">
              {t('admin.photos.backupBannerBody', {
                used: (stats.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(1),
                quota: Math.round(STORAGE_QUOTA_BYTES / (1024 * 1024 * 1024)),
              })}
            </p>
            <div className="admin-gallery__backup-progress-track">
              <div
                className="admin-gallery__backup-progress-fill"
                style={{ width: `${Math.min(100, (stats.storage_used_bytes / STORAGE_QUOTA_BYTES) * 100)}%` }}
              />
            </div>
          </div>
          <button type="button" className="admin-gallery__control-btn" disabled title={t('admin.photos.comingSoon')}>
            <History size={14} aria-hidden />
            {t('admin.photos.syncLogButton')}
          </button>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <AdminModal
          titleId="admin-gallery-add-photo-title"
          title={t('admin.photos.addPhotoModalTitle')}
          size="md"
          onClose={() => setIsAddModalOpen(false)}
          t={t}>
          <AlbumUploadPanel onUploadSuccess={handleAddPhotoSuccess} />
        </AdminModal>
      ) : null}

      {previewPhoto
        ? createPortal(
            <div className="admin-modal-backdrop" onClick={() => setPreviewPhoto(null)}>
              <div className="photo-lightbox" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="admin-modal__close photo-lightbox__close"
                  aria-label={t('common.cancel')}
                  onClick={() => setPreviewPhoto(null)}>
                  <X size={18} aria-hidden />
                </button>
                {isVideoMimeType(previewPhoto.mime_type) ? (
                  <video className="photo-lightbox__media" src={previewPhoto.image_url} controls autoPlay />
                ) : (
                  <img
                    className="photo-lightbox__media"
                    src={previewPhoto.image_url}
                    alt={previewPhoto.caption || previewPhoto.uploader_name}
                  />
                )}
                <p className="photo-lightbox__caption">
                  {previewPhoto.uploader_name}
                  {previewPhoto.caption ? ` — “${previewPhoto.caption}”` : ''}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </SkeletonTheme>
  );
}
