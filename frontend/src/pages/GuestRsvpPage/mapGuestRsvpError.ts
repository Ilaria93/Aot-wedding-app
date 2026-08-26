import type { TranslationKey } from '@/i18n/translations';

/** Maps a failed guest-RSVP-confirm HTTP status to the copy key to show. */
export function mapGuestRsvpErrorToMessageKey(statusCode: number | undefined): TranslationKey {
  if (statusCode === 403) {
    return 'rsvp.deadlineClosedError';
  }
  if (statusCode === 404) {
    return 'invite.notFoundBody';
  }
  return 'rsvp.submitError';
}
