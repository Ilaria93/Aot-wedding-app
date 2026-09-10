import { Cake, Church, Mic2, PartyPopper, UtensilsCrossed, Wine, type LucideIcon } from 'lucide-react';

import type { TranslateFn } from '@/i18n/translations';
import type { PhotoTagId } from '@/services/photoAlbumApi';

export const PHOTO_TAG_IDS: PhotoTagId[] = ['ceremony', 'cake', 'party', 'toast', 'banquet', 'speech', 'other'];

const PHOTO_TAG_ICONS: Record<PhotoTagId, LucideIcon> = {
  ceremony: Church,
  cake: Cake,
  party: PartyPopper,
  toast: Wine,
  banquet: UtensilsCrossed,
  speech: Mic2,
  other: PartyPopper,
};

export function getPhotoTagLabel(tag: PhotoTagId, t: TranslateFn): string {
  if (tag === 'ceremony') return t('photoTags.ceremony');
  if (tag === 'cake') return t('photoTags.cake');
  if (tag === 'party') return t('photoTags.party');
  if (tag === 'toast') return t('photoTags.toast');
  if (tag === 'banquet') return t('photoTags.banquet');
  if (tag === 'speech') return t('photoTags.speech');
  return t('photoTags.other');
}

export function getPhotoTagIcon(tag: PhotoTagId): LucideIcon {
  return PHOTO_TAG_ICONS[tag];
}
