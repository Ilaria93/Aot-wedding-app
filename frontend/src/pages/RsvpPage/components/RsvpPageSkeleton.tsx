import { useI18n } from '@/contexts/I18nContext';

/** Skeleton placeholder while the RSVP payload loads. */
export function RsvpPageSkeleton() {
  const { t } = useI18n();

  return (
    <div className="obw-page rsvp-page rsvp-page--loading" aria-busy="true" aria-live="polite">
      <div className="obw-page__grain" aria-hidden="true" />
      <div className="obw-container rsvp-page__inner">
        <span className="sr-only">{t('common.loading')}</span>
        <div className="obw-skeleton rsvp-skeleton--hero" />
        <div className="obw-skeleton rsvp-skeleton--panel" />
      </div>
    </div>
  );
}
