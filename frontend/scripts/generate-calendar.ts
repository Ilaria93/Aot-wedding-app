// Regenerates the static calendar files served to Apple devices: `npm run calendar`.
import { writeFileSync } from 'node:fs';

import { translations } from '../src/i18n/translations';
import { buildWeddingIcs, CALENDAR_FILE, SITE_URL } from '../src/services/weddingCalendar';

for (const locale of ['it', 'en'] as const) {
  const t = (key: string, values?: Record<string, string | number>) => {
    const template = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], translations[locale]) as string;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? ''));
  };
  writeFileSync(`public/${CALENDAR_FILE[locale]}`, buildWeddingIcs(t as never, SITE_URL, Date.UTC(2026, 9, 1)));
}
