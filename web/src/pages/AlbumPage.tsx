import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  completePhotoUpload,
  createPhotoUploadIntent,
  fetchPublicPhotoAlbum,
  type PublicPhotoAlbumItem,
} from '@/services/photoAlbumApi';
import { getApiErrorMessage, getApiStatusCode } from '@/utils/apiErrors';
import { formatDateByLocale } from '@/utils/formatters';

/** Guest-facing wedding album with browser file upload. */
export function AlbumPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAlbum = useCallback(async () => {
    try {
      setError(null);
      const publicPhotos = await fetchPublicPhotoAlbum();
      setPhotos(publicPhotos);
    } catch {
      setError(t('album.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAlbum();
  }, [loadAlbum]);

  async function handleUpload() {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const normalizedToken = invitationToken.trim();
    if (!normalizedToken) {
      setUploadMessage(t('album.missingTokenError'));
      return;
    }
    if (!selectedFile) {
      setUploadMessage(t('album.missingPhotoError'));
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadMessage(null);

      const mimeType = selectedFile.type || 'image/jpeg';
      const fileSizeBytes = selectedFile.size || 1;
      const uploadIntent = await createPhotoUploadIntent({
        invitation_token: normalizedToken,
        original_filename: selectedFile.name,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
      });

      const uploadResponse = await fetch(uploadIntent.upload_url, {
        method: uploadIntent.upload_method,
        headers: uploadIntent.upload_headers,
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Storage upload failed');
      }

      await completePhotoUpload({
        invitation_token: normalizedToken,
        storage_key: uploadIntent.storage_key,
        original_filename: selectedFile.name,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        caption: caption.trim() || undefined,
      });

      setCaption('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadMessage(t('album.uploadSuccess'));
      await loadAlbum();
    } catch (caughtError) {
      if (getApiStatusCode(caughtError) === 401) {
        navigate('/auth/login');
        return;
      }
      setUploadMessage(getApiErrorMessage(caughtError, t('album.uploadError')));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="loading-screen">…</div>;
  }

  return (
    <div className="page-shell">
      <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <p className="eyebrow">{t('album.eyebrow')}</p>
        <h1 className="title">{t('album.title')}</h1>
        <p className="subtitle">{t('album.subtitle')}</p>
        <button
          type="button"
          className="button button-secondary"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadAlbum();
          }}>
          {refreshing ? t('album.refreshLoading') : t('album.refreshButton')}
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <h2 className="section-heading">{t('album.uploadTitle')}</h2>
        <p className="subtitle">{t('album.uploadDescription')}</p>
        {!isAuthenticated ? <p className="helper-text">{t('album.loginHint')}</p> : null}
        <input
          className="input"
          placeholder={t('common.fields.invitationToken')}
          value={invitationToken}
          onChange={(event) => setInvitationToken(event.target.value)}
        />
        <textarea
          className="textarea"
          style={{ marginTop: 12 }}
          placeholder={t('album.captionPlaceholder')}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ marginTop: 12 }}
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        {selectedFile ? <p className="helper-text">{selectedFile.name}</p> : null}
        <button
          type="button"
          className="button button-primary"
          style={{ marginTop: 12 }}
          disabled={uploading}
          onClick={() => void handleUpload()}>
          {uploading ? t('album.uploadLoading') : t('album.uploadButton')}
        </button>
        {uploadMessage ? <p className="helper-text">{uploadMessage}</p> : null}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {photos.map((photo) => (
          <article key={photo.id} className="dev-card">
            <img
              src={photo.image_url}
              alt={photo.caption || photo.guest_full_name}
              style={{ width: '100%', borderRadius: 12, aspectRatio: '4 / 3', objectFit: 'cover' }}
            />
            {photo.caption ? <p>{photo.caption}</p> : null}
            <p className="helper-text">{formatDateByLocale(photo.uploaded_at, locale)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
