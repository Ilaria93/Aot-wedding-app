import { INTOLERANCE_IDS, MEAL_CHOICE_IDS } from '@/constants/rsvpParty';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import type { RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useI18n } from '@/contexts/I18nContext';
import './styles/Rsvp.scss';

type RsvpGuestLineFieldsProps = {
  guest: RsvpGuestDraft;
  index: number;
  errors: RsvpGuestFieldError[];
  onChange: (clientId: string, patch: Partial<RsvpGuestDraft>) => void;
  onRemove?: (clientId: string) => void;
};

function fieldError(
  errors: RsvpGuestFieldError[],
  clientId: string,
  field: RsvpGuestFieldError['field'],
) {
  return errors.find((item) => item.clientId === clientId && item.field === field);
}

/** Single guest row with menu selects and optional dietary notes. */
export function RsvpGuestLineFields({
  guest,
  index,
  errors,
  onChange,
  onRemove,
}: RsvpGuestLineFieldsProps) {
  const { t } = useI18n();
  const firstNameError = fieldError(errors, guest.clientId, 'first_name');
  const lastNameError = fieldError(errors, guest.clientId, 'last_name');
  const notesError = fieldError(errors, guest.clientId, 'dietary_notes');

  return (
    <article
      className={`rsvp-guest-card${guest.isAccountHolder ? ' rsvp-guest-card--account' : ''}`}>
      <header className="rsvp-guest-card__header">
        <div className="rsvp-guest-card__title-wrap">
          <p className="obw-kicker">{t('rsvp.guestLabel', { number: index + 1 })}</p>
          {guest.isAccountHolder ? (
            <p className="obw-kicker rsvp-guest-card__badge">{t('rsvp.accountHolderBadge')}</p>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            className="obw-btn obw-btn--ghost rsvp-guest-card__remove"
            onClick={() => onRemove(guest.clientId)}>
            {t('rsvp.removeGuest')}
          </button>
        ) : null}
      </header>

      <div className="rsvp-guest-card__grid">
        <label className="obw-field" htmlFor={`rsvp-first-name-${guest.clientId}`}>
          <span className="obw-kicker">{t('rsvp.firstNameLabel')}</span>
          <input
            id={`rsvp-first-name-${guest.clientId}`}
            className="obw-input"
            value={guest.first_name}
            disabled={guest.isAccountHolder}
            onChange={(event) =>
              onChange(guest.clientId, { first_name: event.target.value })
            }
          />
          {firstNameError ? (
            <span className="rsvp-field-error">{t(firstNameError.messageKey)}</span>
          ) : null}
        </label>

        <label className="obw-field" htmlFor={`rsvp-last-name-${guest.clientId}`}>
          <span className="obw-kicker">{t('rsvp.lastNameLabel')}</span>
          <input
            id={`rsvp-last-name-${guest.clientId}`}
            className="obw-input"
            value={guest.last_name}
            disabled={guest.isAccountHolder}
            onChange={(event) => onChange(guest.clientId, { last_name: event.target.value })}
          />
          {lastNameError ? (
            <span className="rsvp-field-error">{t(lastNameError.messageKey)}</span>
          ) : null}
        </label>

        <label className="obw-field" htmlFor={`rsvp-meal-${guest.clientId}`}>
          <span className="obw-kicker">{t('rsvp.mealLabel')}</span>
          <select
            id={`rsvp-meal-${guest.clientId}`}
            className="obw-select"
            value={guest.meal_choice}
            onChange={(event) =>
              onChange(guest.clientId, {
                meal_choice: event.target.value as RsvpGuestDraft['meal_choice'],
              })
            }>
            {MEAL_CHOICE_IDS.map((mealId) => (
              <option key={mealId} value={mealId}>
                {t(`rsvp.mealChoices.${mealId}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="obw-field" htmlFor={`rsvp-intolerance-${guest.clientId}`}>
          <span className="obw-kicker">{t('rsvp.intoleranceLabel')}</span>
          <select
            id={`rsvp-intolerance-${guest.clientId}`}
            className="obw-select"
            value={guest.intolerance}
            onChange={(event) =>
              onChange(guest.clientId, {
                intolerance: event.target.value as RsvpGuestDraft['intolerance'],
              })
            }>
            {INTOLERANCE_IDS.map((intoleranceId) => (
              <option key={intoleranceId} value={intoleranceId}>
                {t(`rsvp.intolerances.${intoleranceId}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="obw-field rsvp-guest-card__notes" htmlFor={`rsvp-notes-${guest.clientId}`}>
          <span className="obw-kicker">{t('rsvp.dietaryNotesLabel')}</span>
          <textarea
            id={`rsvp-notes-${guest.clientId}`}
            className="obw-textarea"
            placeholder={t('rsvp.dietaryNotesPlaceholder')}
            value={guest.dietary_notes}
            onChange={(event) =>
              onChange(guest.clientId, { dietary_notes: event.target.value })
            }
          />
          {notesError ? (
            <span className="rsvp-field-error">{t(notesError.messageKey)}</span>
          ) : null}
        </label>
      </div>
    </article>
  );
}
