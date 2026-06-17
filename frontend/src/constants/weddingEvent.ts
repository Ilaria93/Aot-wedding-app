import type { AppLocale } from '@/i18n/translations';

export const WEDDING_COUPLE_NAMES = 'Ilaria & Davide' as const;
export const WEDDING_OPERATION_NAME = 'Operation Ravenna' as const;
export const WEDDING_VENUE_NAME = 'Lido Adriano' as const;
export const WEDDING_VENUE_AREA = 'Amarissimo Cala Celeste' as const;
export const WEDDING_CITY = 'Ravenna' as const;
export const WEDDING_TIMEZONE = 'Europe/Rome' as const;

export const WEDDING_LOCAL = {
  year: 2027,
  month: 5,
  day: 31,
  hour: 16,
  minute: 30,
} as const;

const localeMap: Record<AppLocale, string> = {
  it: 'it-IT',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

/** Resolves a Europe/Rome local datetime to UTC epoch milliseconds. */
function zonedLocalToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const target = { year, month, day, hour, minute };
  let ms = Date.UTC(year, month - 1, day, hour, minute);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(ms))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>;

    const diffMinutes =
      (target.year - parts.year) * 525_600 +
      (target.month - parts.month) * 43_200 +
      (target.day - parts.day) * 1_440 +
      (target.hour - parts.hour) * 60 +
      (target.minute - parts.minute);

    if (diffMinutes === 0) {
      return ms;
    }

    ms += diffMinutes * 60_000;
  }

  return ms;
}

/** UTC epoch ms for 31 May 2027 at 16:30 Europe/Rome. */
export function getWeddingTimestampMs(): number {
  const { year, month, day, hour, minute } = WEDDING_LOCAL;
  return zonedLocalToUtcMs(year, month, day, hour, minute, WEDDING_TIMEZONE);
}

/** Remaining time until the wedding ceremony in Europe/Rome. */
export function getCountdownParts(nowMs = Date.now()): CountdownParts {
  const totalMs = Math.max(0, getWeddingTimestampMs() - nowMs);
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs };
}

/** Full venue line for cards and cinematic blackout copy. */
export function formatVenueLine(): string {
  return `${WEDDING_VENUE_NAME} · ${WEDDING_VENUE_AREA} · ${WEDDING_CITY}`;
}

/** Long-form ceremony date and time for editorial sections. */
export function formatWeddingDateTimeDisplay(locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeMap[locale], {
    timeZone: WEDDING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(getWeddingTimestampMs()));
}

/** Uppercase trailer date for cinematic blackout (e.g. 31 MAGGIO 2027). */
export function formatWeddingTrailerDate(locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeMap[locale], {
    timeZone: WEDDING_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(getWeddingTimestampMs()))
    .toUpperCase();
}

/** Ceremony time only for editorial cards. */
export function formatWeddingTimeDisplay(locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeMap[locale], {
    timeZone: WEDDING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(getWeddingTimestampMs()));
}

/** Ceremony date only for editorial cards. */
export function formatWeddingDateDisplay(locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeMap[locale], {
    timeZone: WEDDING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(getWeddingTimestampMs()));
}
