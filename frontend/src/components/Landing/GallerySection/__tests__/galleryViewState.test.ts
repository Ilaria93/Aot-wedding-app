import { describe, expect, it } from 'vitest';

import { toGalleryViewState } from '@/components/Landing/GallerySection/GallerySection';
import type { PublicPhotoAlbumItem } from '@/services/photoAlbumApi';

const photo = (id: number): PublicPhotoAlbumItem => ({
  id,
  uploader_name: 'Test Guest',
  image_url: `https://example.com/${id}.jpg`,
  uploaded_at: '2027-05-31T12:00:00Z',
});

describe('toGalleryViewState', () => {
  it('shows loading while the request is in flight', () => {
    expect(toGalleryViewState(true, false, [])).toEqual({ status: 'loading' });
  });

  it('shows error state when the fetch failed', () => {
    expect(toGalleryViewState(false, true, [])).toEqual({ status: 'error' });
  });

  it('shows empty state when the album has no photos', () => {
    expect(toGalleryViewState(false, false, [])).toEqual({ status: 'empty' });
  });

  it('exposes photos when the album has some', () => {
    const photos = [photo(1), photo(2)];
    expect(toGalleryViewState(false, false, photos)).toEqual({ status: 'ready', photos });
  });
});
