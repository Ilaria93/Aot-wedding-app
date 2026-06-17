import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  completePhotoUpload,
  createPhotoUploadIntent,
} from '@/services/photoAlbumApi';
import { getApiErrorMessage, getApiStatusCode } from '@/services/apiErrors';
import { formatBytes } from '@/types/formatters';

type AlbumUploadPanelProps = {
  onUploadSuccess: () => Promise<void>;
};

/** Guest photo upload form with token, caption and file picker. */
export function AlbumUploadPanel({ onUploadSuccess }: AlbumUploadPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handlePickImage() {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    fileInputRef.current?.click();
  }

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
        setUploadMessage(t('album.uploadError'));
        return;
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
      await onUploadSuccess();
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

  return (
    <div className="section-card">
      <h2 className="section-title">{t('album.uploadTitle')}</h2>
      <p className="section-description">{t('album.uploadDescription')}</p>
      {!isAuthenticated ? <p className="helper-text">{t('album.loginHint')}</p> : null}
      <input
        className="input"
        placeholder={t('common.fields.invitationToken')}
        value={invitationToken}
        onChange={(event) => setInvitationToken(event.target.value)}
      />
      <textarea
        className="textarea input--multiline"
        placeholder={t('album.captionPlaceholder')}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setSelectedFile(file);
          if (!file) {
            setPreviewUrl(null);
            return;
          }
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
        }}
      />
      <button type="button" className="button button-secondary" onClick={handlePickImage}>
        {isAuthenticated
          ? selectedFile
            ? t('album.changePhoto')
            : t('album.choosePhoto')
          : t('album.loginChoosePhoto')}
      </button>
      {selectedFile && previewUrl ? (
        <div className="preview-card">
          <img className="preview-card__image" src={previewUrl} alt={selectedFile.name} />
          <p className="preview-card__meta">{selectedFile.name}</p>
          <p className="preview-card__meta">
            {formatBytes(selectedFile.size)}
            {selectedFile.type ? ` • ${selectedFile.type}` : ''}
          </p>
        </div>
      ) : null}
      <button
        type="button"
        className="button button-primary button--spaced-top-sm"
        disabled={uploading}
        onClick={() => void handleUpload()}>
        {isAuthenticated
          ? uploading
            ? t('album.uploadLoading')
            : t('album.uploadButton')
          : t('album.loginUploadButton')}
      </button>
      {uploadMessage ? <p className="helper-text">{uploadMessage}</p> : null}
    </div>
  );
}
