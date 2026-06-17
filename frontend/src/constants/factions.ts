import type { FactionId } from '@/services/guestApi';
import type { TranslateFn } from '@/i18n/translations';

export const FACTION_IDS: FactionId[] = [
  'scout_regiment',
  'military_police',
  'garrison',
];

export function isFactionId(value: string | null | undefined): value is FactionId {
  return FACTION_IDS.some((item) => item === value);
}

export function getFactionOptions(t: TranslateFn) {
  return FACTION_IDS.map((id) => ({
    id,
    label: getFactionLabel(id, t) ?? id,
  }));
}

export function getFactionLabel(
  factionId: FactionId | string | null | undefined,
  t: TranslateFn,
) {
  if (!factionId) {
    return null;
  }

  if (factionId === 'scout_regiment') {
    return t('factions.scout_regiment');
  }
  if (factionId === 'military_police') {
    return t('factions.military_police');
  }
  if (factionId === 'garrison') {
    return t('factions.garrison');
  }

  return factionId;
}
