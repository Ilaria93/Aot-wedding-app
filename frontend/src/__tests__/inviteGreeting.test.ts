import { describe, expect, it } from 'vitest';

import { formatInviteGreeting, formatInviteHeadline, isPluralInvite } from '@/components/EnvelopeInvite/inviteGreeting';
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

describe('formatInviteHeadline', () => {
  const t = translator('it') as never;

  it('agrees with gender and number', () => {
    expect(formatInviteHeadline(t, 'single_m')).toBe('sei invitato al nostro matrimonio');
    expect(formatInviteHeadline(t, 'single_f')).toBe('sei invitata al nostro matrimonio');
    expect(formatInviteHeadline(t, 'single')).toBe('sei invitato/a al nostro matrimonio');
    expect(formatInviteHeadline(t, 'couple')).toBe('siete invitati al nostro matrimonio');
    expect(formatInviteHeadline(t, 'family')).toBe('siete invitati al nostro matrimonio');
  });

  it('keeps one wording in English whoever is addressed', () => {
    const en = translator('en') as never;
    expect(formatInviteHeadline(en, 'single_f')).toBe('you are invited to our wedding');
    expect(formatInviteHeadline(en, 'family')).toBe('you are all invited to our wedding');
  });
});

describe('plural wording', () => {
  it('only couples and families are addressed in the plural', () => {
    expect(['single_m', 'single_f', 'single', 'couple', 'family'].map((kind) => isPluralInvite(kind as never))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it('has a plural wording for every sentence that addresses the guest', () => {
    const it = translator('it');
    const text = (key: string) => (it as unknown as (k: string) => string)(key);
    expect(text('invite.mission')).toContain('ti invitiamo');
    expect(text('invite.missionPlural')).toContain('vi invitiamo');
    expect(text('invite.closing')).toContain('averti');
    expect(text('invite.closingPlural')).toContain('avervi');
    expect(text('invite.rsvpSection.titlePlural')).toBe('Attendiamo la vostra risposta');
    expect(text('invite.rsvpSection.note')).toContain('la tua presenza');
    expect(text('invite.rsvpSection.notePlural')).toContain('la vostra presenza');
    expect(text('invite.rsvpSection.yes')).toBe('Ci sarò');
    expect(text('invite.rsvpSection.yesPlural')).toBe('Ci saremo');
    expect(text('invite.rsvpSection.no')).toBe('Non ci sarò');
    expect(text('invite.rsvpSection.noPlural')).toBe('Non ci saremo');
    expect(text('invite.moreInfo.text')).toContain('trovi');
    expect(text('invite.moreInfo.textPlural')).toContain('trovate');
  });
});
