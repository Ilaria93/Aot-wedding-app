import { MAX_PARTY_GUESTS } from '@/constants/rsvpParty';
import { buildEmptyGuestLine } from '@/components/Rsvp/buildInitialGuestLines';
import { RsvpGuestLineFields } from '@/components/Rsvp/RsvpGuestLineFields';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import type { RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useI18n } from '@/contexts/I18nContext';
import './styles/Rsvp.scss';

type RsvpPartyFormProps = {
  attending: boolean;
  guests: RsvpGuestDraft[];
  submitting: boolean;
  isEditMode: boolean;
  fieldErrors: RsvpGuestFieldError[];
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
  onAttendingChange,
  onGuestsChange,
  onSubmit,
  onCancelEdit,
}: RsvpPartyFormProps) {
  const { t } = useI18n();
  const canAddGuest = attending && guests.length < MAX_PARTY_GUESTS;

  function updateGuest(clientId: string, patch: Partial<RsvpGuestDraft>) {
    onGuestsChange(
      guests.map((guest) => (guest.clientId === clientId ? { ...guest, ...patch } : guest)),
    );
  }

  function removeGuest(clientId: string) {
    onGuestsChange(guests.filter((guest) => guest.clientId !== clientId));
  }

  function addGuest() {
    if (!canAddGuest) {
      return;
    }
    onGuestsChange([...guests, buildEmptyGuestLine()]);
  }

  return (
    <section className="obw-card obw-card--interactive rsvp-panel obw-fade-up">
      <header className="rsvp-panel__header">
        <p className="obw-kicker">{t('rsvp.formTitle')}</p>
        <h2 className="obw-display obw-display--sm">{t('rsvp.attendQuestion')}</h2>
      </header>

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

      {attending ? (
        <div className="rsvp-panel__section">
          <div className="rsvp-panel__party-meta">
            <p className="obw-kicker">{t('rsvp.guestsTitle')}</p>
            <p className="obw-kicker rsvp-panel__party-count">
              {t('rsvp.partyCount', { current: guests.length, max: MAX_PARTY_GUESTS })}
            </p>
          </div>
          <p className="obw-body rsvp-panel__hint">{t('rsvp.guestsHint')}</p>

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
              onClick={addGuest}>
              {t('rsvp.addGuest')}
            </button>
          ) : (
            <p className="obw-body rsvp-panel__hint">{t('rsvp.maxGuestsReached')}</p>
          )}
        </div>
      ) : (
        <p className="obw-body">{t('rsvp.notAttendingHint')}</p>
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
