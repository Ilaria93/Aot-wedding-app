import { Link } from 'react-router-dom';

import { getFactionOptions } from '@/constants/factions';
import type { FactionId } from '@/services/guestApi';
import { useI18n } from '@/contexts/I18nContext';

type RsvpFormProps = {
  isAuthenticated: boolean;
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
  isAuthenticated,
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
    <div className="section-card">
      <h2 className="section-title">{t('rsvp.formTitle')}</h2>
      {!isAuthenticated ? (
        <div className="login-prompt-card">
          <p className="helper-text helper-text--flush">{t('rsvp.loginHint')}</p>
          <Link className="text-link" to="/auth/login">
            {t('rsvp.loginLink')}
          </Link>
        </div>
      ) : null}

      <div className="segment-row">
        <button
          type="button"
          className={`segment-button${attending ? ' is-active' : ''}`}
          onClick={() => onAttendingChange(true)}>
          {t('common.yes')}
        </button>
        <button
          type="button"
          className={`segment-button${!attending ? ' is-active' : ''}`}
          onClick={() => onAttendingChange(false)}>
          {t('common.no')}
        </button>
      </div>

      {attending ? (
        <>
          <p className="field-label field-label--spaced">{t('rsvp.chooseFaction')}</p>
          {getFactionOptions(t).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`faction-card${faction === item.id ? ' is-active' : ''}`}
              onClick={() => onFactionChange(item.id)}>
              <p className="faction-card__title">{item.label}</p>
              <p className="faction-card__description">{t('rsvp.factionDescription')}</p>
            </button>
          ))}
          <label className="field-label field-label--spaced">{t('rsvp.dietaryLabel')}</label>
          <textarea
            className="textarea"
            placeholder={t('rsvp.dietaryPlaceholder')}
            value={dietaryNotes}
            onChange={(event) => onDietaryNotesChange(event.target.value)}
          />
        </>
      ) : (
        <p className="helper-text">{t('rsvp.notAttendingHint')}</p>
      )}

      <button
        type="button"
        className="button button-primary button--spaced-top"
        disabled={submitting}
        onClick={onSubmit}>
        {isAuthenticated
          ? submitting
            ? t('rsvp.submitLoading')
            : t('rsvp.submitLabel')
          : t('rsvp.loginSubmitLabel')}
      </button>
    </div>
  );
}
