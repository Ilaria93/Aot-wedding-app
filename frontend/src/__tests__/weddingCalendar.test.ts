import { describe, expect, it } from 'vitest';

import { buildWeddingIcs } from '@/services/weddingCalendar';
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
