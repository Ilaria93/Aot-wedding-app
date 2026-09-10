import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { getPhotoTagLabel, PHOTO_TAG_IDS } from '@/constants/photoTags';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  completePhotoUpload,
  createPhotoUploadIntent,
  type PhotoTagId,
} from '@/services/photoAlbumApi';
import { getApiStatusCode } from '@/services/apiErrors';
import { formatBytes } from '@/types/formatters';

type AlbumUploadPanelProps = {
  onUploadSuccess: () => Promise<void>;
};

/** Authenticated photo/video upload form with caption, moment tag, and multi-file picker. */
export function AlbumUploadPanel({ onUploadSuccess }: AlbumUploadPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tag, setTag] = useState<PhotoTagId | ''>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  function handlePickImage() {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: '/album' } });
      return;
    }
    fileInputRef.current?.click();
  }

  function resetSelection() {
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function uploadOneFile(file: File) {
    const mimeType = file.type || 'image/jpeg';
    const fileSizeBytes = file.size || 1;
    const uploadIntent = await createPhotoUploadIntent({
      original_filename: file.name,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
    });

    const uploadResponse = await fetch(uploadIntent.upload_url, {
      method: uploadIntent.upload_method,
      headers: uploadIntent.upload_headers,
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('upload-failed');
    }

    await completePhotoUpload({
      storage_key: uploadIntent.storage_key,
      original_filename: file.name,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      caption: caption.trim() || undefined,
      tag: tag || undefined,
    });
  }

  async function handleUpload() {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: '/album' } });
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadMessage(t('album.missingPhotoError'));
      return;
    }

    const total = selectedFiles.length;
    let succeeded = 0;

    try {
      setUploading(true);
      setUploadMessage(null);

      for (const file of selectedFiles) {
        setUploadMessage(t('album.uploadProgress', { done: succeeded, total }));
        try {
          await uploadOneFile(file);
          succeeded += 1;
        } catch (caughtError) {
          if (getApiStatusCode(caughtError) === 401) {
            navigate('/auth/login', { state: { from: '/album' } });
            return;
          }
        }
      }

      setCaption('');
      setTag('');
      resetSelection();
      setUploadMessage(
        succeeded === total
          ? t('album.uploadSuccessMultiple', { count: succeeded })
          : t('album.uploadPartialError', { done: succeeded, total }),
      );
      await onUploadSuccess();
    } finally {
      setUploading(false);
    }
  }

  const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="obw-card">
      <h2 className="obw-display obw-display--sm">{t('album.uploadTitle')}</h2>
      <p className="obw-body">{t('album.uploadDescription')}</p>
      {!isAuthenticated ? <p className="helper-text">{t('album.loginHint')}</p> : null}
      <textarea
        className="obw-textarea album-upload-panel__field"
        placeholder={t('album.captionPlaceholder')}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        disabled={!isAuthenticated}
      />
      <select
        className="obw-select album-upload-panel__field"
        value={tag}
        onChange={(event) => setTag(event.target.value as PhotoTagId | '')}
        disabled={!isAuthenticated}>
        <option value="">{t('album.tagPlaceholder')}</option>
        {PHOTO_TAG_IDS.map((tagId) => (
          <option key={tagId} value={tagId}>
            {getPhotoTagLabel(tagId, t)}
          </option>
        ))}
      </select>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          previewUrls.forEach((url) => URL.revokeObjectURL(url));
          setSelectedFiles(files);
          setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
        }}
      />
      <button
        type="button"
        className="obw-btn obw-btn--secondary album-upload-panel__choose"
        onClick={handlePickImage}>
        {isAuthenticated
          ? selectedFiles.length > 0
            ? t('album.changePhoto')
            : t('album.choosePhoto')
          : t('album.loginChoosePhoto')}
      </button>
      {selectedFiles.length > 0 ? (
        <div className="preview-card">
          <p className="preview-card__meta">
            {t('album.filesSelectedCount', { count: selectedFiles.length })} · {formatBytes(totalBytes)}
          </p>
          <div className="album-upload-panel__preview-grid">
            {selectedFiles.map((file, index) => (
              <div className="album-upload-panel__preview-item" key={`${file.name}-${index}`}>
                {file.type.startsWith('video/') ? (
                  <video className="album-upload-panel__preview-thumb" src={previewUrls[index]} muted />
                ) : (
                  <img className="album-upload-panel__preview-thumb" src={previewUrls[index]} alt={file.name} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="obw-btn obw-btn--primary obw-btn--block album-upload-panel__submit"
        disabled={uploading}
        onClick={() => void handleUpload()}>
        {isAuthenticated
          ? uploading
            ? t('album.uploadLoading')
            : selectedFiles.length > 1
              ? t('album.uploadButtonMultiple', { count: selectedFiles.length })
              : t('album.uploadButton')
          : t('album.loginUploadButton')}
      </button>
      {uploadMessage ? <p className="helper-text">{uploadMessage}</p> : null}
    </div>
  );
}
