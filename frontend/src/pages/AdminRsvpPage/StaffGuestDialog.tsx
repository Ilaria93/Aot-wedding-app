import { useState, type FormEvent } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { useI18n } from '@/contexts/I18nContext';
import { getApiErrorMessage } from '@/services/apiErrors';
import {
  createStaffGuest,
  updateStaffGuest,
  type AdminTable,
  type StaffGuest,
} from '@/services/adminDashboardApi';
import type { IntoleranceId, MealChoiceId } from '@/services/rsvpApi';
import {
  EMPTY_STAFF_FORM,
  STAFF_INTOLERANCES,
  STAFF_MEAL_CHOICES,
  staffGuestToForm,
  toStaffGuestPayload,
  validateStaffGuestForm,
  type StaffGuestFormField,
  type StaffGuestFormValues,
} from './staffGuestForm';

type StaffGuestDialogProps = {
  /** The person being edited; null to add a new one. */
  guest: StaffGuest | null;
  tables: AdminTable[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

/** Add or edit one supplier's person: name, role, menu, intolerance, table. */
export function StaffGuestDialog({ guest, tables, onClose, onSaved }: StaffGuestDialogProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<StaffGuestFormValues>(guest ? staffGuestToForm(guest) : EMPTY_STAFF_FORM);
  const [errors, setErrors] = useState<Partial<Record<StaffGuestFormField, 'required'>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof StaffGuestFormValues>(field: K, value: StaffGuestFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateStaffGuestForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setMessage(null);
    try {
      const payload = toStaffGuestPayload(values);
      if (guest) {
        await updateStaffGuest(guest.id, payload);
      } else {
        await createStaffGuest(payload);
      }
      await onSaved();
      onClose();
    } catch (caughtError) {
      setMessage(getApiErrorMessage(caughtError, t('admin.staff.saveFailed')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      titleId="staff-guest-title"
      title={guest ? t('admin.staff.editTitle') : t('admin.staff.addTitle')}
      onClose={onClose}
      t={t}>
      <form className="admin-rsvp__new-table-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.name')}</span>
          <input
            className="admin-rsvp__new-table-input"
            type="text"
            autoFocus
            value={values.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => update('name', event.target.value)}
          />
          {errors.name ? <small>{t('admin.staff.errorRequired')}</small> : null}
        </label>

        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.role')}</span>
          <input
            className="admin-rsvp__new-table-input"
            type="text"
            placeholder={t('admin.staff.rolePlaceholder')}
            value={values.role}
            onChange={(event) => update('role', event.target.value)}
          />
        </label>

        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.meal')}</span>
          <select
            className="admin-rsvp__new-table-input"
            value={values.mealChoice}
            onChange={(event) => update('mealChoice', event.target.value as MealChoiceId)}>
            {STAFF_MEAL_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {t(`rsvp.mealChoices.${choice}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.intolerance')}</span>
          <select
            className="admin-rsvp__new-table-input"
            value={values.intolerance}
            onChange={(event) => update('intolerance', event.target.value as IntoleranceId)}>
            {STAFF_INTOLERANCES.map((intolerance) => (
              <option key={intolerance} value={intolerance}>
                {t(`rsvp.intolerances.${intolerance}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.notes')}</span>
          <input
            className="admin-rsvp__new-table-input"
            type="text"
            value={values.dietaryNotes}
            aria-invalid={Boolean(errors.dietaryNotes)}
            onChange={(event) => update('dietaryNotes', event.target.value)}
          />
          {errors.dietaryNotes ? <small>{t('admin.staff.errorNotesRequired')}</small> : null}
        </label>

        <label className="admin-rsvp__staff-field">
          <span>{t('admin.staff.table')}</span>
          <select
            className="admin-rsvp__new-table-input"
            value={values.tableId ?? ''}
            onChange={(event) => update('tableId', event.target.value === '' ? null : Number(event.target.value))}>
            <option value="">{t('admin.staff.noTable')}</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label}
              </option>
            ))}
          </select>
        </label>

        {message ? (
          <p className="admin-rsvp__staff-message" role="alert">
            {message}
          </p>
        ) : null}

        <div className="admin-modal__actions">
          <button type="submit" className="obw-portal-btn" disabled={saving}>
            {saving ? t('admin.staff.saving') : t('common.save')}
          </button>
          <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
