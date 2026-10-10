import {
  getWeddingTimestampMs,
  WEDDING_LODGING,
  WEDDING_LODGING_HOTEL,
  WEDDING_MAP_QUERY,
  WEDDING_MAPS_URL,
} from '@/constants/weddingEvent';
import type { TranslateFn } from '@/i18n/translations';

/** The calendar event runs from the recommended arrival (16:30) for this long, i.e. until 02:00 the next morning. */
const EVENT_DURATION_HOURS = 9.5;

/** The public address the calendar notes point to (the .ics files in /public carry the same one). */
export const SITE_URL = 'https://www.davideeilaria.it';
/** Static copies of the event, one per language, in /public (see weddingCalendar.test.ts). */
export const CALENDAR_FILE = { it: 'matrimonio-davide-ilaria.it.ics', en: 'matrimonio-davide-ilaria.en.ics' } as const;

/** UTC "basic" format calendars expect: 20270531T143000Z. */
function toIcsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines over 75 characters are folded onto the next line, which starts with a space. */
function fold(line: string): string {
  const parts: string[] = [];
  for (let index = 0; index < line.length; index += 73) {
    parts.push(line.slice(index, index + 73));
  }
  return parts.join('\r\n ');
}

/** The wedding as an .ics file: start, end, place and the residence/hotel info in the notes. */
export function buildWeddingIcs(t: TranslateFn, siteUrl: string, now = Date.now()): string {
  const start = getWeddingTimestampMs();
  const end = start + EVENT_DURATION_HOURS * 3_600_000;
  const { title, description } = eventTexts(t, siteUrl);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Davide e Ilaria//Wedding//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:wedding-2027-05-31@davide-e-ilaria',
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(WEDDING_MAP_QUERY)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${siteUrl}`,
    // Reminders a week and a day before.
    ...['-P7D', '-P1D'].flatMap((trigger) => [
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(title)}`,
      `TRIGGER:${trigger}`,
      'END:VALARM',
    ]),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n');
}

function eventTexts(t: TranslateFn, siteUrl: string) {
  const description = t('calendar.description', {
    arrival: t('landing.ceremony.arrivalTime'),
    ceremony: t('landing.ceremony.startTime'),
    venue: WEDDING_MAP_QUERY,
    mapUrl: WEDDING_MAPS_URL,
    residence: WEDDING_LODGING.label,
    residenceUrl: WEDDING_LODGING.website,
    hotel: WEDDING_LODGING_HOTEL.label,
    hotelUrl: WEDDING_LODGING_HOTEL.website,
    siteUrl,
  });
  return { title: t('calendar.title'), description };
}

/** Opens Google Calendar's "new event" screen already filled in: the app on Android, the web on a computer. */
export function buildGoogleCalendarUrl(t: TranslateFn, siteUrl: string): string {
  const start = getWeddingTimestampMs();
  const end = start + EVENT_DURATION_HOURS * 3_600_000;
  const { title, description } = eventTexts(t, siteUrl);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    details: description,
    location: WEDDING_MAP_QUERY,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** iPhone, iPad and Mac: the .ics opens Apple's own "Add to Calendar" sheet, so that is the default there. */
const isApple = () => /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

/** Where the main button goes: the .ics (Apple's calendar) on Apple devices, Google Calendar's new-event screen elsewhere. */
export function openWeddingCalendar(t: TranslateFn, locale: 'it' | 'en') {
  window.location.href = isApple() ? `/${CALENDAR_FILE[locale]}` : buildGoogleCalendarUrl(t, SITE_URL);
}

/** The other way, same on every phone: save the .ics as a file, for whatever calendar app the guest uses. */
export function downloadCalendarFile(locale: 'it' | 'en') {
  const link = document.createElement('a');
  link.href = `/${CALENDAR_FILE[locale]}`;
  link.download = 'matrimonio-davide-ilaria.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
