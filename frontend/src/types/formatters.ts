import type { AppLocale } from '@/i18n/translations';

const localeMap: Record<AppLocale, string> = {
  it: 'it-IT',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function formatDateByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(localeMap[locale], options).format(new Date(value));
}

/** Human-readable file size for upload previews. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
