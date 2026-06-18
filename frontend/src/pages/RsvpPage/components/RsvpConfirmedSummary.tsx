import { getFactionLabel } from '@/constants/factions';
import type { FactionId } from '@/services/rsvpApi';
import { useI18n } from '@/contexts/I18nContext';

export type ConfirmedRsvpState = {
  attending: boolean;
  faction: FactionId | null;
  dietaryNotes: string | null;
};

type RsvpConfirmedSummaryProps = {
  confirmedRsvp: ConfirmedRsvpState | null;
};

/** Read-only summary shown after RSVP confirmation. */
export function RsvpConfirmedSummary({ confirmedRsvp }: RsvpConfirmedSummaryProps) {
  const { t } = useI18n();

  return (
    <div className="section-card">
      <h2 className="section-title">{t('rsvp.confirmedTitle')}</h2>
      <div className="summary-row">
        <p className="summary-label">{t('rsvp.statusLabel')}</p>
        <p className="summary-value summary-value--flush">
          {confirmedRsvp?.attending ? t('rsvp.attendingStatus') : t('rsvp.notAttendingStatus')}
        </p>
      </div>
      {confirmedRsvp?.attending && confirmedRsvp.faction ? (
        <div className="summary-row">
          <p className="summary-label">{t('rsvp.factionLabel')}</p>
          <p className="summary-value summary-value--flush">
            {getFactionLabel(confirmedRsvp.faction, t)}
          </p>
        </div>
      ) : null}
      {confirmedRsvp?.attending && confirmedRsvp.dietaryNotes ? (
        <div className="summary-row">
          <p className="summary-label">{t('rsvp.dietaryLabel')}</p>
          <p className="summary-value summary-value--flush">{confirmedRsvp.dietaryNotes}</p>
        </div>
      ) : null}
    </div>
  );
}
