import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';

import { buildGoogleCalendarUrl, buildWeddingIcs, CALENDAR_FILE, SITE_URL } from '@/services/weddingCalendar';
import { translations } from '@/i18n/translations';

function translator(locale: 'it' | 'en') {
  return (key: string, values?: Record<string, string | number>) => {
    const template = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], translations[locale]) as string;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? ''));
  };
}

describe('buildWeddingIcs', () => {
  const ics = buildWeddingIcs(translator('it') as never, 'https://example.test', Date.UTC(2026, 9, 1));
  const unfolded = ics.replace(/\r\n /g, '');

  it('starts at 16:30 Rome time (14:30 UTC) and ends at 02:00 the next morning (00:00 UTC)', () => {
    expect(unfolded).toContain('DTSTART:20270531T143000Z');
    expect(unfolded).toContain('DTEND:20270601T000000Z');
  });

  it('reminds a week and a day before', () => {
    expect(unfolded).toContain('TRIGGER:-P7D');
    expect(unfolded).toContain('TRIGGER:-P1D');
  });

  it('carries the place and where to stay in the notes, escaped', () => {
    expect(unfolded).toContain('LOCATION:Amarissimo Cala Celeste\\, Lido Adriano\\, Ravenna');
    expect(unfolded).toContain('https://www.google.com/maps/search/?api=1&query=Amarissimo');
    expect(unfolded).toContain('Long Beach Village');
    expect(unfolded).toContain('Hotel Le Dune');
    expect(unfolded).toContain('https://example.test');
  });

  it('is a well-formed calendar with CRLF line ends', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.split('\r\n').every((line) => line.length <= 75)).toBe(true);
  });
});

describe('direct-open calendar', () => {
  it('the static .ics files served to Apple devices match what the code builds (run `npm run calendar` if this fails)', () => {
    for (const locale of ['it', 'en'] as const) {
      const built = buildWeddingIcs(translator(locale) as never, SITE_URL, Date.UTC(2026, 9, 1));
      expect(readFileSync(`public/${CALENDAR_FILE[locale]}`, 'utf8')).toBe(built);
    }
  });

  it('builds a pre-filled Google Calendar link with the same times and place', () => {
    const url = new URL(buildGoogleCalendarUrl(translator('it') as never, 'https://example.test'));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('dates')).toBe('20270531T143000Z/20270601T000000Z');
    expect(url.searchParams.get('location')).toBe('Amarissimo Cala Celeste, Lido Adriano, Ravenna');
    expect(url.searchParams.get('details')).toContain('Long Beach Village');
  });
});
