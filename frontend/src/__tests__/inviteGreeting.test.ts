import { describe, expect, it } from 'vitest';

import { formatInviteGreeting } from '@/components/EnvelopeInvite/inviteGreeting';
import { translations } from '@/i18n/translations';

// A tiny translate function over the real Italian/English dictionaries.
function translator(locale: 'it' | 'en') {
  return (key: string, values?: Record<string, string | number>) => {
    const template = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], translations[locale]) as string;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? ''));
  };
}

describe('formatInviteGreeting', () => {
  const t = translator('it') as never;

  it('greets a family by name', () => {
    expect(formatInviteGreeting(t, 'it', { kind: 'family', name: 'Rossi', names: ['Rossi'] })).toBe('Cara famiglia Rossi,');
  });

  it('greets single people by gender, neutral when unknown', () => {
    expect(formatInviteGreeting(t, 'it', { kind: 'single_m', name: 'Mario', names: ['Mario'] })).toBe('Caro Mario,');
    expect(formatInviteGreeting(t, 'it', { kind: 'single_f', name: 'Anna', names: ['Anna'] })).toBe('Cara Anna,');
    expect(formatInviteGreeting(t, 'it', { kind: 'single', name: 'Zia', names: ['Zia'] })).toBe('Cara/o Zia,');
  });

  it('joins a couple’s names in the reader’s language', () => {
    const names = ['Chiara', 'Luca'];
    expect(formatInviteGreeting(t, 'it', { kind: 'couple', name: 'Chiara e Luca', names })).toBe('Cari Chiara e Luca,');
    expect(
      formatInviteGreeting(translator('en') as never, 'en', { kind: 'couple', name: 'Chiara e Luca', names }),
    ).toBe('Dear Chiara and Luca,');
  });
});
