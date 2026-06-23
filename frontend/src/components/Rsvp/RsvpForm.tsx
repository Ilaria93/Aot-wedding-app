import { getFactionOptions } from '@/constants/factions';
import type { FactionId } from '@/services/rsvpApi';
import { useI18n } from '@/contexts/I18nContext';

type RsvpFormProps = {
  attending: boolean;
  faction: FactionId;
  dietaryNotes: string;
  submitting: boolean;
  onAttendingChange: (attending: boolean) => void;
  onFactionChange: (faction: FactionId) => void;
  onDietaryNotesChange: (notes: string) => void;
  onSubmit: () => void;
};

/** RSVP form with attendance toggle, faction picker and dietary notes. */
export function RsvpForm({
  attending,
  faction,
  dietaryNotes,
  submitting,
  onAttendingChange,
  onFactionChange,
  onDietaryNotesChange,
  onSubmit,
}: RsvpFormProps) {
  const { t } = useI18n();

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
          <p className="obw-kicker">{t('rsvp.chooseFaction')}</p>
          <div className="obw-choice-list" role="radiogroup" aria-label={t('rsvp.chooseFaction')}>
            {getFactionOptions(t).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`obw-choice${faction === item.id ? ' is-active' : ''}`}
                onClick={() => onFactionChange(item.id)}
                aria-pressed={faction === item.id}>
                <span className="obw-choice__radio" aria-hidden="true" />
                <span>
                  <span className="obw-choice__title">{item.label}</span>
                  <span className="obw-choice__desc">{t('rsvp.factionDescription')}</span>
                </span>
              </button>
            ))}
          </div>

          <label className="obw-field" htmlFor="rsvp-dietary-notes">
            <span className="obw-kicker">{t('rsvp.dietaryLabel')}</span>
            <textarea
              id="rsvp-dietary-notes"
              className="obw-textarea"
              placeholder={t('rsvp.dietaryPlaceholder')}
              value={dietaryNotes}
              onChange={(event) => onDietaryNotesChange(event.target.value)}
            />
          </label>
        </div>
      ) : (
        <p className="obw-body">{t('rsvp.notAttendingHint')}</p>
      )}

      <button
        type="button"
        className="obw-btn obw-btn--primary obw-btn--block rsvp-panel__submit"
        disabled={submitting}
        onClick={onSubmit}>
        {submitting ? t('rsvp.submitLoading') : t('rsvp.submitLabel')}
      </button>
    </section>
  );
}
