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
  const isAttending = confirmedRsvp?.attending ?? false;

  return (
    <section className="rsvp-panel rsvp-panel--confirmed obw-fade-up">
      <div className="obw-card obw-card--dark rsvp-confirmed-card">
        <div className="obw-card__texture" aria-hidden="true" />
        <div className="rsvp-confirmed-card__body">
          <p className="obw-kicker obw-kicker--light">{t('rsvp.confirmedTitle')}</p>
          <h2 className="obw-display obw-display--sm obw-display--light">
            {isAttending ? t('rsvp.attendingStatus') : t('rsvp.notAttendingStatus')}
          </h2>

          <dl className="obw-summary obw-summary--dark">
            <div className="obw-summary__row">
              <dt className="obw-summary__label">{t('rsvp.statusLabel')}</dt>
              <dd className="obw-summary__value">
                {isAttending ? t('rsvp.attendingStatus') : t('rsvp.notAttendingStatus')}
              </dd>
            </div>

            {isAttending && confirmedRsvp?.faction ? (
              <div className="obw-summary__row">
                <dt className="obw-summary__label">{t('rsvp.factionLabel')}</dt>
                <dd className="obw-summary__value">
                  {getFactionLabel(confirmedRsvp.faction, t)}
                </dd>
              </div>
            ) : null}

            {isAttending && confirmedRsvp?.dietaryNotes ? (
              <div className="obw-summary__row">
                <dt className="obw-summary__label">{t('rsvp.dietaryLabel')}</dt>
                <dd className="obw-summary__value obw-body" style={{ margin: 0, color: 'inherit' }}>
                  {confirmedRsvp.dietaryNotes}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}
