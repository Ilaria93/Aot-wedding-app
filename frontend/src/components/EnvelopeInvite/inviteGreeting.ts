import type { GreetingKind } from '@/services/inviteApi';
import type { TranslateFn } from '@/i18n/translations';

type GreetingInput = {
  kind: GreetingKind;
  name: string;
  /** Several names for a couple; joined here in the reader's language. */
  names: string[];
};

/**
 * The invite's opening line: "Cara famiglia Rossi," / "Cari Chiara e Luca," /
 * "Caro Mario,". Which one comes from the group on the server; only the words
 * (and the "and" between a couple's names) are localised here.
 */
export function formatInviteGreeting(t: TranslateFn, locale: string, { kind, name, names }: GreetingInput): string {
  switch (kind) {
    case 'family':
      return t('invite.greetingFamily', { name });
    case 'couple':
      return t('invite.greetingCouple', {
        name: new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names),
      });
    case 'single_m':
      return t('invite.greetingSingleM', { name });
    case 'single_f':
      return t('invite.greetingSingleF', { name });
    default:
      return t('invite.greetingSingle', { name });
  }
}

/** Couples and families are addressed in the plural ("darvi", "con voi"); everyone else in the singular. */
export function isPluralInvite(kind: GreetingKind): boolean {
  return kind === 'family' || kind === 'couple';
}

/** The line under the greeting — "sei stato ufficialmente invitato" — agreeing with who is addressed. */
export function formatInviteHeadline(t: TranslateFn, kind: GreetingKind): string {
  switch (kind) {
    case 'family':
    case 'couple':
      return t('invite.headlinePlural');
    case 'single_m':
      return t('invite.headlineSingleM');
    case 'single_f':
      return t('invite.headlineSingleF');
    default:
      return t('invite.headlineSingle');
  }
}
