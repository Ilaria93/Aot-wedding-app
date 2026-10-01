import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import { requestInvite } from '@/services/inviteApi';
import './styles/InviteRequestDialog.scss';

type Field = 'firstName' | 'lastName' | 'phone';
type Status = 'idle' | 'sending' | 'sent' | 'error' | 'tooMany';
export type InviteRequestValues = Record<Field, string>;
type FieldError = 'required' | 'phoneInvalid';

/** Digits, spaces and phone punctuation, optional leading +, 8–15 actual digits (E.164 max). */
function isPlausiblePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9\s().-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15;
}

/** Client-side check before sending; the backend normalises and validates again. */
export function validateInviteRequest(values: InviteRequestValues): Partial<Record<Field, FieldError>> {
  const errors: Partial<Record<Field, FieldError>> = {};
  if (!values.firstName.trim()) errors.firstName = 'required';
  if (!values.lastName.trim()) errors.lastName = 'required';
  if (!isPlausiblePhone(values.phone.trim())) errors.phone = 'phoneInvalid';
  return errors;
}

type InviteRequestDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * "Can't find your invite?" form for guests who reach the site without their
 * WhatsApp link: name + phone go to the couple for approval. A native
 * <dialog> opened with showModal() gives focus trapping, Esc and an inert
 * page behind it for free.
 */
export function InviteRequestDialog({ open, onClose }: InviteRequestDialogProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<InviteRequestValues>({ firstName: '', lastName: '', phone: '+39 ' });
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, FieldError>>>({});
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() would focus the close button (first focusable); start on the first field.
      dialog.querySelector<HTMLInputElement>('#invite-request-firstName')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function validate() {
    const next = validateInviteRequest(values);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      await requestInvite({
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        phone: values.phone.trim(),
        website,
      });
      setStatus('sent');
    } catch (caughtError) {
      setStatus(getApiStatusCode(caughtError) === 429 ? 'tooMany' : 'error');
    }
  }

  function handleClose() {
    onClose();
    // Reset after a successful request so a second visit starts clean.
    if (status === 'sent') {
      setValues({ firstName: '', lastName: '', phone: '+39 ' });
      setStatus('idle');
    }
  }

  function fieldProps(field: Field) {
    return {
      id: `invite-request-${field}`,
      value: values[field],
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? `invite-request-${field}-error` : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        setValues((current) => ({ ...current, [field]: event.target.value })),
    };
  }

  return (
    <dialog
      ref={dialogRef}
      className="obw-card obw-card--dark invite-request"
      aria-labelledby="invite-request-title"
      onClose={handleClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> itself, not its content.
        if (event.target === event.currentTarget) handleClose();
      }}>
      <div className="invite-request__body">
        <button type="button" className="invite-request__close" aria-label={t('common.cancel')} onClick={handleClose}>
          <X size={18} aria-hidden />
        </button>

        <p className="obw-kicker">{t('landing.inviteRequest.kicker')}</p>
        <h2 id="invite-request-title" className="obw-display invite-request__title">
          {t('landing.inviteRequest.title')}
        </h2>

        {status === 'sent' ? (
          <div className="invite-request__done" role="status">
            <p className="obw-body">{t('landing.inviteRequest.successBody')}</p>
            <button type="button" className="obw-btn obw-btn--secondary" onClick={handleClose}>
              {t('landing.inviteRequest.close')}
            </button>
          </div>
        ) : (
          <form className="invite-request__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
            <p className="obw-body invite-request__intro">{t('landing.inviteRequest.intro')}</p>

            <div className="invite-request__row">
              {(['firstName', 'lastName'] as const).map((field) => (
                <div key={field} className="invite-request__field">
                  <label htmlFor={`invite-request-${field}`}>{t(`landing.inviteRequest.${field}`)}</label>
                  <input
                    type="text"
                    autoComplete={field === 'firstName' ? 'given-name' : 'family-name'}
                    {...fieldProps(field)}
                  />
                  {errors[field] ? (
                    <span id={`invite-request-${field}-error`} className="invite-request__error">
                      {t(`landing.inviteRequest.${errors[field]}`)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="invite-request__field">
              <label htmlFor="invite-request-phone">{t('landing.inviteRequest.phone')}</label>
              <input type="tel" inputMode="tel" autoComplete="tel" {...fieldProps('phone')} />
              {errors.phone ? (
                <span id="invite-request-phone-error" className="invite-request__error">
                  {t(`landing.inviteRequest.${errors.phone}`)}
                </span>
              ) : null}
            </div>

            {/* Honeypot: hidden from people, irresistible to form-filling bots. */}
            <input
              className="invite-request__trap"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />

            <p className="invite-request__privacy">{t('landing.inviteRequest.privacy')}</p>

            {status === 'error' || status === 'tooMany' ? (
              <p className="invite-request__error" role="alert">
                {t(status === 'tooMany' ? 'landing.inviteRequest.tooMany' : 'landing.inviteRequest.genericError')}
              </p>
            ) : null}

            <button type="submit" className="obw-btn invite-request__submit" disabled={status === 'sending'}>
              {t(status === 'sending' ? 'landing.inviteRequest.sending' : 'landing.inviteRequest.submit')}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
