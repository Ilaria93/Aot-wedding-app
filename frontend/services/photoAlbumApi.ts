import { apiClient } from '@/services/apiClient';

export type PublicPhotoAlbumItem = {
  id: number;
  guest_full_name: string;
  caption?: string | null;
  image_url: string;
  uploaded_at: string;
};

export type PhotoUploadIntentPayload = {
  invitation_token: string;
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
  invitation_token: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  caption?: string;
};

export type PhotoUploadCompleteResponse = {
  ok: boolean;
  photo_id: number;
  status: PhotoAlbumStatus;
};

export type PhotoUploadMethod = 'PUT';
export type PhotoAlbumStatus = 'pending' | 'approved' | 'rejected';

export type AdminPhotoAlbumItem = {
  id: number;
  guest_id: number;
  guest_full_name: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  caption?: string | null;
  status: PhotoAlbumStatus;
  image_url: string;
  file_size_bytes: number;
  uploaded_at: string;
  approved_at?: string | null;
};

export type AdminPhotoStatus = AdminPhotoAlbumItem['status'];

// Loads only approved photos for the guest-facing album.
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

// Loads all uploaded photos for admin moderation.
export async function fetchAdminPhotoAlbum(): Promise<AdminPhotoAlbumItem[]> {
  const { data } = await apiClient.get<AdminPhotoAlbumItem[]>('/admin/photos');
  return data;
}

// Updates admin moderation status for one uploaded photo.
export async function updateAdminPhotoStatus(
  photoId: number,
  status: AdminPhotoStatus,
): Promise<AdminPhotoAlbumItem> {
  const { data } = await apiClient.patch<AdminPhotoAlbumItem>(`/admin/photos/${photoId}`, { status });
  return data;
}
