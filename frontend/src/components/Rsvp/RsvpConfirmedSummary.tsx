import { getFactionLabel } from '@/constants/factions';
import type { FactionId, RsvpGuestLine } from '@/services/rsvpApi';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/i18n/translations';
import './styles/Rsvp.scss';

export type ConfirmedRsvpState = {
  attending: boolean;
  faction: FactionId | null;
  guests: RsvpGuestLine[];
};

type RsvpConfirmedSummaryProps = {
  confirmedRsvp: ConfirmedRsvpState | null;
  editable: boolean;
  onEdit?: () => void;
};

function mealLabelKey(mealChoice: RsvpGuestLine['meal_choice']): TranslationKey {
  return `rsvp.mealChoices.${mealChoice}` as TranslationKey;
}

function intoleranceLabelKey(intolerance: RsvpGuestLine['intolerance']): TranslationKey {
  return `rsvp.intolerances.${intolerance}` as TranslationKey;
}

/** Read-only summary shown after RSVP confirmation or when edits are closed. */
export function RsvpConfirmedSummary({
  confirmedRsvp,
  editable,
  onEdit,
}: RsvpConfirmedSummaryProps) {
  const { t } = useI18n();
  const isAttending = confirmedRsvp?.attending ?? false;

  return (
    <section className="rsvp-panel rsvp-panel--confirmed obw-fade-up">
      {!editable ? (
        <div className="obw-card rsvp-deadline-banner" role="status">
          <p className="obw-kicker">{t('rsvp.deadlineClosedTitle')}</p>
          <p className="obw-body">{t('rsvp.deadlineClosedBanner')}</p>
        </div>
      ) : null}

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
          </dl>

          {isAttending && confirmedRsvp?.faction ? (
            <div className="rsvp-faction-reveal">
              <p className="obw-kicker obw-kicker--light">{t('rsvp.factionLabel')}</p>
              <p className="obw-display obw-display--sm obw-display--light rsvp-faction-reveal__name">
                {getFactionLabel(confirmedRsvp.faction, t)}
              </p>
            </div>
          ) : null}

          {isAttending && confirmedRsvp?.guests.length ? (
            <div className="rsvp-guest-summary">
              <p className="obw-kicker obw-kicker--light">{t('rsvp.guestsSummaryTitle')}</p>
              <ul className="rsvp-guest-summary__list">
                {confirmedRsvp.guests.map((guest, index) => (
                  <li
                    key={`${guest.first_name}-${guest.last_name}-${index}`}
                    className="rsvp-guest-summary__item">
                    <p className="rsvp-guest-summary__index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <div className="rsvp-guest-summary__content">
                      <p className="rsvp-guest-summary__name">
                        {guest.first_name} {guest.last_name}
                      </p>
                      <p className="rsvp-guest-summary__meta">
                        {t(mealLabelKey(guest.meal_choice))}
                        {' · '}
                        {t(intoleranceLabelKey(guest.intolerance))}
                      </p>
                      {guest.dietary_notes ? (
                        <p className="rsvp-guest-summary__notes">{guest.dietary_notes}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {editable && onEdit ? (
        <button type="button" className="obw-btn obw-btn--secondary rsvp-panel__edit" onClick={onEdit}>
          {t('rsvp.editButton')}
        </button>
      ) : null}
    </section>
  );
}
