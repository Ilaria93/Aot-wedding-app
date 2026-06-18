import { apiClient } from '@/services/apiClient';

export type PublicPhotoAlbumItem = {
  id: number;
  uploader_name: string;
  caption?: string | null;
  image_url: string;
  uploaded_at: string;
};

export type PhotoUploadIntentPayload = {
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
};

export type PhotoUploadIntentResponse = {
  storage_key: string;
  upload_url: string;
  upload_method: PhotoUploadMethod;
  upload_headers: Record<string, string>;
  max_file_size_bytes: number;
  expires_in_seconds: number;
};

export type PhotoUploadCompletePayload = {
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  caption?: string;
};

export type PhotoUploadCompleteResponse = {
  ok: boolean;
  photo_id: number;
  status: 'approved';
};

export type PhotoUploadMethod = 'PUT';

// Loads public wedding album photos.
export async function fetchPublicPhotoAlbum(): Promise<PublicPhotoAlbumItem[]> {
  const { data } = await apiClient.get<PublicPhotoAlbumItem[]>('/photos');
  return data;
}

// Requests a presigned upload target before sending bytes directly to S3.
export async function createPhotoUploadIntent(
  payload: PhotoUploadIntentPayload,
): Promise<PhotoUploadIntentResponse> {
  const { data } = await apiClient.post<PhotoUploadIntentResponse>('/photos/upload-intent', payload);
  return data;
}

// Persists metadata only after the direct upload succeeds.
export async function completePhotoUpload(
  payload: PhotoUploadCompletePayload,
): Promise<PhotoUploadCompleteResponse> {
  const { data } = await apiClient.post<PhotoUploadCompleteResponse>('/photos/complete-upload', payload);
  return data;
}
