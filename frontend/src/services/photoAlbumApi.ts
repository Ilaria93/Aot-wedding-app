import { apiClient } from '@/services/apiClient';

export type PhotoTagId = 'ceremony' | 'cake' | 'party' | 'toast' | 'banquet' | 'speech' | 'other';

export type PublicPhotoAlbumItem = {
  id: number;
  uploader_name: string;
  caption?: string | null;
  image_url: string;
  mime_type: string;
  tag?: PhotoTagId | null;
  is_favorite: boolean;
  uploaded_at: string;
};

export type AdminGalleryStats = {
  total_photos: number;
  total_videos: number;
  storage_used_bytes: number;
  tag_counts: Partial<Record<PhotoTagId, number>>;
};

export type FetchAdminPhotoListParams = {
  search?: string;
  tag?: PhotoTagId;
  page?: number;
  pageSize?: number;
};

export type AdminPhotoListResponse = {
  items: PublicPhotoAlbumItem[];
  total: number;
  page: number;
  page_size: number;
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
  tag?: PhotoTagId;
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

// Removes a photo from the album and its storage — admin only.
export async function deleteAdminPhoto(photoId: number): Promise<void> {
  await apiClient.delete(`/admin/photos/${photoId}`);
}

// Photo/video counts and total storage used — feeds the gallery admin dashboard.
export async function fetchAdminGalleryStats(): Promise<AdminGalleryStats> {
  const { data } = await apiClient.get<AdminGalleryStats>('/admin/photos/stats');
  return data;
}

// Paginated, searchable, tag-filterable gallery grid for the admin page.
export async function fetchAdminPhotoList(params: FetchAdminPhotoListParams = {}): Promise<AdminPhotoListResponse> {
  const { data } = await apiClient.get<AdminPhotoListResponse>('/admin/photos', {
    params: {
      search: params.search || undefined,
      tag: params.tag,
      page: params.page,
      page_size: params.pageSize,
    },
  });
  return data;
}

// Toggles the "keep this one" flag.
export async function updatePhotoFavorite(photoId: number, isFavorite: boolean): Promise<PublicPhotoAlbumItem> {
  const { data } = await apiClient.patch<PublicPhotoAlbumItem>(`/admin/photos/${photoId}`, {
    is_favorite: isFavorite,
  });
  return data;
}

// Edits a guest's caption/tag — the pencil action on the admin gallery card.
export async function updateAdminPhoto(
  photoId: number,
  fields: { caption?: string | null; tag?: PhotoTagId | null },
): Promise<PublicPhotoAlbumItem> {
  const { data } = await apiClient.patch<PublicPhotoAlbumItem>(`/admin/photos/${photoId}`, fields);
  return data;
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}
