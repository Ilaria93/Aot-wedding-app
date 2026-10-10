import { buildEmptyGuestLine } from '@/components/Rsvp/buildInitialGuestLines';
import { RsvpGuestLineFields } from '@/components/Rsvp/RsvpGuestLineFields';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import type { RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useI18n } from '@/contexts/I18nContext';
import type { RsvpPartyLimits } from '@/pages/RsvpPage/useRsvpDraft';
import './styles/Rsvp.scss';

type RsvpPartyFormProps = {
  attending: boolean;
  guests: RsvpGuestDraft[];
  submitting: boolean;
  isEditMode: boolean;
  fieldErrors: RsvpGuestFieldError[];
  /** Overrides the default "first row is your account" hint, which only fits a logged-in guest. */
  guestsHint?: string;
  /** Overrides the "add guest" button label (the guest page uses a shorter one). */
  addGuestLabel?: string;
  /** "Yes" was already chosen on the invite letter: show it as settled instead of asking Yes/No again. */
  attendingLocked?: boolean;
  /** Overrides the text shown when "No" is selected. */
  notAttendingHint?: string;
  /** Read from the backend — see useRsvpDraft — never hardcoded here. */
  partyLimits: RsvpPartyLimits;
  onAttendingChange: (attending: boolean) => void;
  onGuestsChange: (guests: RsvpGuestDraft[]) => void;
  onSubmit: () => void;
  onCancelEdit?: () => void;
};

/** RSVP form with attendance toggle and editable party guest lines. */
export function RsvpPartyForm({
  attending,
  guests,
  submitting,
  isEditMode,
  fieldErrors,
  partyLimits,
  guestsHint,
  addGuestLabel,
  notAttendingHint,
  attendingLocked = false,
  onAttendingChange,
  onGuestsChange,
  onSubmit,
  onCancelEdit,
}: RsvpPartyFormProps) {
  const { t } = useI18n();
  const canAddGuest = attending && guests.length < partyLimits.max;

  function updateGuest(clientId: string, patch: Partial<RsvpGuestDraft>) {
    onGuestsChange(
      guests.map((guest) => (guest.clientId === clientId ? { ...guest, ...patch } : guest)),
    );
  }

  function removeGuest(clientId: string) {
    onGuestsChange(guests.filter((guest) => guest.clientId !== clientId));
  }

  /** "How many are you?": grows or shrinks the list to that number (the first row always stays). */
  function setPartySize(size: number) {
    if (size === guests.length) {
      return;
    }
    onGuestsChange(
      size > guests.length
        ? [...guests, ...Array.from({ length: size - guests.length }, buildEmptyGuestLine)]
        : guests.slice(0, size),
    );
  }

  function addGuest() {
    if (!canAddGuest) {
      return;
    }
    onGuestsChange([...guests, buildEmptyGuestLine()]);
  }

  return (
    <section className="obw-card obw-card--dark obw-card--interactive rsvp-panel obw-fade-up">
      {attendingLocked ? (
        <header className="rsvp-panel__header">
          <h2 className="obw-display obw-display--sm">{t('guestRsvp.lockedYes')}</h2>
        </header>
      ) : (
        <header className="rsvp-panel__header">
          <h2 className="obw-display obw-display--sm">{t('rsvp.attendQuestion')}</h2>
        </header>
      )}

      {attendingLocked ? null : (
        <div className="obw-choice-row" role="group" aria-label={t('rsvp.attendQuestion')}>
          <button
            type="button"
            className={`obw-choice${attending ? ' is-active' : ''}`}
            onClick={() => onAttendingChange(true)}
            aria-pressed={attending}>
            <span className="obw-choice__radio" aria-hidden="true" />
            <span className="obw-choice__label">{t('common.yes')}</span>
          </button>
          <button
            type="button"
            className={`obw-choice${!attending ? ' is-active' : ''}`}
            onClick={() => onAttendingChange(false)}
            aria-pressed={!attending}>
            <span className="obw-choice__radio" aria-hidden="true" />
            <span className="obw-choice__label">{t('common.no')}</span>
          </button>
        </div>
      )}

      {attending ? (
        <div className="rsvp-panel__section">
          <label className="obw-field" htmlFor="rsvp-party-size">
            <span className="obw-kicker">{t('rsvp.partySizeLabel')}</span>
            <select
              id="rsvp-party-size"
              className="obw-select"
              value={guests.length}
              onChange={(event) => setPartySize(Number(event.target.value))}>
              {Array.from({ length: partyLimits.max }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
          <p className="obw-body rsvp-panel__hint">{t('rsvp.partySizeHint')}</p>
          <div className="rsvp-panel__party-meta">
            <p className="obw-kicker">{t('rsvp.guestsTitle')}</p>
          </div>
          <p className="obw-body rsvp-panel__hint">{guestsHint ?? t('rsvp.guestsHint')}</p>

          <div className="rsvp-guest-list">
            {guests.map((guest, index) => (
              <RsvpGuestLineFields
                key={guest.clientId}
                guest={guest}
                index={index}
                errors={fieldErrors}
                onChange={updateGuest}
                onRemove={guest.isAccountHolder ? undefined : removeGuest}
              />
            ))}
          </div>

          {canAddGuest ? (
            <button
              type="button"
              className="obw-btn obw-btn--secondary rsvp-panel__add-guest"
              onClick={(event) => {
                // A mouse/touch click shouldn't leave the button highlighted
                // (focus ring); detail is 0 for keyboard, which keeps its focus.
                if (event.detail > 0) {
                  event.currentTarget.blur();
                }
                addGuest();
              }}>
              {addGuestLabel ?? t('rsvp.addGuest')}
            </button>
          ) : (
            <p className="obw-body rsvp-panel__hint rsvp-panel__limit">
              {t('rsvp.maxGuestsReached', { max: partyLimits.max })}
            </p>
          )}
        </div>
      ) : (
        <p className="obw-body rsvp-panel__not-attending">{notAttendingHint ?? t('rsvp.notAttendingHint')}</p>
      )}

      <div className="rsvp-panel__actions">
        <button
          type="button"
          className="obw-btn obw-btn--primary obw-btn--block"
          disabled={submitting}
          onClick={onSubmit}>
          {submitting
            ? isEditMode
              ? t('rsvp.saveEditLoading')
              : t('rsvp.submitLoading')
            : isEditMode
              ? t('rsvp.saveEditLabel')
              : t('rsvp.submitLabel')}
        </button>
        {isEditMode && onCancelEdit ? (
          <button
            type="button"
            className="obw-btn obw-btn--ghost obw-btn--block"
            disabled={submitting}
            onClick={onCancelEdit}>
            {t('rsvp.cancelEditLabel')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
