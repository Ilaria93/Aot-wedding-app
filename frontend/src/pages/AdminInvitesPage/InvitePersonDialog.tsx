import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import {
  createInvite,
  getDuplicateMatches,
  isLockedError,
  lookupInvites,
  updateInvite,
  type AdminInviteItem,
  type InviteMatch,
  type Relation,
} from '@/services/adminInvitesApi';
import {
  EMPTY_INVITE_FORM,
  RELATION_KEYS,
  buildCreatePayload,
  validateInviteForm,
  type InviteFormField,
  type InviteFormValues,
} from './inviteForm';

const RELATIONS: Relation[] = ['spouse', 'partner', 'child', 'other'];

/** What the dialog is for: a new person (maybe prefilled or pre-linked) or an edit. */
export type PersonDialogMode =
  | { kind: 'add'; prefill?: Partial<InviteFormValues> }
  | { kind: 'edit'; values: InviteFormValues; personId: number };

type InvitePersonDialogProps = {
  mode: PersonDialogMode;
  /** Heads whose group can still change: the choices for "linked to". */
  editableHeads: AdminInviteItem[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  /** Resend the existing invite of a match (instead of adding a duplicate). */
  onResend: (match: InviteMatch) => void;
  formatDate: (iso: string) => string;
};

/** Add or edit one person of the guest table: a head, or someone linked to a head. */
export function InvitePersonDialog({
  mode,
  editableHeads,
  onClose,
  onSaved,
  onResend,
  formatDate,
}: InvitePersonDialogProps) {
  const { t } = useI18n();
  const isEdit = mode.kind === 'edit';
  const [values, setValues] = useState<InviteFormValues>(
    mode.kind === 'edit' ? mode.values : { ...EMPTY_INVITE_FORM, ...mode.prefill },
  );
  const [errors, setErrors] = useState<Partial<Record<InviteFormField, string>>>({});
  const [matches, setMatches] = useState<InviteMatch[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // A Telegram link opens the form prefilled: say right away if they are already in the table.
  const prefill = mode.kind === 'add' ? mode.prefill : undefined;
  useEffect(() => {
    if (!prefill?.firstName && !prefill?.lastName) return;
    let active = true;
    lookupInvites({
      first_name: prefill.firstName ?? '',
      last_name: prefill.lastName ?? '',
      phone: prefill.phone || null,
    })
      .then((found) => {
        if (active) setMatches(found);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [prefill?.firstName, prefill?.lastName, prefill?.phone]);

  const heads = useMemo(
    () => editableHeads.map((head) => ({ id: head.id, label: `${head.first_name} ${head.last_name}` })),
    [editableHeads],
  );

  function update<K extends keyof InviteFormValues>(field: K, value: InviteFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const errorText = (field: InviteFormField) => {
    const error = errors[field];
    if (!error) return null;
    if (error === 'phoneInvalid') return t('admin.invites.errorPhone');
    if (error === 'partySizeInvalid') return t('admin.invites.errorPartySize');
    return t('admin.invites.errorRequired');
  };

  async function save(confirmDuplicate: boolean) {
    setMessage(null);
    const found = validateInviteForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (mode.kind === 'edit') {
        const { head_id: _head, ...changes } = buildCreatePayload(values);
        await updateInvite(mode.personId, changes);
      } else {
        await createInvite(buildCreatePayload(values), confirmDuplicate);
      }
      await onSaved();
      onClose();
    } catch (caughtError) {
      const duplicates = getDuplicateMatches(caughtError);
      if (duplicates.length > 0) {
        setMatches(duplicates);
      } else if (isLockedError(caughtError)) {
        setMessage(t('admin.invites.lockedError'));
      } else if (getApiStatusCode(caughtError) === 422) {
        setMessage(t('admin.invites.invalidGroup'));
      } else {
        setMessage(t('admin.invites.actionFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void save(false);
  }

  const isMember = values.role === 'member';
  const lockedRole = isEdit; // an existing person never changes role or head here

  return (
    <AdminModal
      titleId="invite-person-title"
      title={isEdit ? t('admin.invites.editTitle') : t('admin.invites.addTitle')}
      size="md"
      onClose={onClose}
      t={t}>
      {matches.length > 0 ? (
        <div className="invite-form__duplicates" role="alert">
          <p className="invite-form__duplicates-title">{t('admin.invites.duplicateTitle')}</p>
          <p className="admin-modal__body">{t('admin.invites.duplicateBody')}</p>
          <ul>
            {matches.map((match) => {
              const person = `${match.first_name} ${match.last_name}`;
              const head = `${match.head.first_name} ${match.head.last_name}`;
              return (
                <li key={match.id}>
                  <span>
                    {match.relation ? t('admin.invites.duplicateInGroup', { name: person, head }) : person}
                    {' · '}
                    {match.head.sent_at
                      ? t('admin.invites.duplicateSent', { date: formatDate(match.head.sent_at) })
                      : t('admin.invites.duplicateNotSent')}
                  </span>
                  <button type="button" className="obw-portal-btn" onClick={() => onResend(match)}>
                    {match.head.sent_at ? t('admin.invites.resend') : t('admin.invites.send')}
                  </button>
                </li>
              );
            })}
          </ul>
          {!isEdit ? (
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary"
              disabled={saving}
              onClick={() => void save(true)}>
              {t('admin.invites.addAnyway')}
            </button>
          ) : null}
        </div>
      ) : null}

      <form className="invite-form" onSubmit={handleSubmit} noValidate>
        {!lockedRole ? (
          <fieldset className="invite-form__roles">
            <legend>{t('admin.invites.roleLabel')}</legend>
            {(['head', 'member'] as const).map((role) => (
              <label key={role}>
                <input
                  type="radio"
                  name="invite-role"
                  checked={values.role === role}
                  onChange={() => update('role', role)}
                />
                {role === 'head' ? t('admin.invites.roleHead') : t('admin.invites.roleMember')}
              </label>
            ))}
          </fieldset>
        ) : null}

        {isMember && !lockedRole ? (
          <label className="invite-form__field">
            <span>{t('admin.invites.headLabel')}</span>
            <select
              value={values.headId ?? ''}
              aria-invalid={Boolean(errors.headId)}
              onChange={(event) => update('headId', event.target.value ? Number(event.target.value) : null)}>
              <option value="">{t('admin.invites.headPlaceholder')}</option>
              {heads.map((head) => (
                <option key={head.id} value={head.id}>
                  {head.label}
                </option>
              ))}
            </select>
            {errorText('headId') ? <small>{errorText('headId')}</small> : null}
          </label>
        ) : null}

        {isMember ? (
          <label className="invite-form__field">
            <span>{t('admin.invites.relationLabel')}</span>
            <select
              value={values.relation}
              aria-invalid={Boolean(errors.relation)}
              onChange={(event) => update('relation', event.target.value as InviteFormValues['relation'])}>
              <option value="">{t('admin.invites.relationPlaceholder')}</option>
              {RELATIONS.map((relation) => (
                <option key={relation} value={relation}>
                  {t(RELATION_KEYS[relation])}
                </option>
              ))}
            </select>
            {errorText('relation') ? <small>{errorText('relation')}</small> : null}
          </label>
        ) : null}

        <div className="invite-form__row">
          <label className="invite-form__field">
            <span>{t('admin.invites.firstName')}</span>
            <input
              value={values.firstName}
              aria-invalid={Boolean(errors.firstName)}
              autoComplete="off"
              onChange={(event) => update('firstName', event.target.value)}
            />
            {errorText('firstName') ? <small>{errorText('firstName')}</small> : null}
          </label>
          <label className="invite-form__field">
            <span>{t('admin.invites.lastName')}</span>
            <input
              value={values.lastName}
              aria-invalid={Boolean(errors.lastName)}
              autoComplete="off"
              onChange={(event) => update('lastName', event.target.value)}
            />
            {errorText('lastName') ? <small>{errorText('lastName')}</small> : null}
          </label>
        </div>

        <div className="invite-form__row">
          <label className="invite-form__field">
            <span>{t('admin.invites.phone')}</span>
            <input
              type="tel"
              value={values.phone}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="off"
              onChange={(event) => update('phone', event.target.value)}
            />
            {errorText('phone') ? <small>{errorText('phone')}</small> : null}
          </label>
          <label className="invite-form__field">
            <span>{t('admin.invites.gender')}</span>
            <select value={values.gender} onChange={(event) => update('gender', event.target.value as InviteFormValues['gender'])}>
              <option value="">{t('admin.invites.genderNone')}</option>
              <option value="m">{t('admin.invites.genderM')}</option>
              <option value="f">{t('admin.invites.genderF')}</option>
            </select>
          </label>
        </div>

        {!isMember ? (
          <>
            <label className="invite-form__field">
              <span>{t('admin.invites.familyName')}</span>
              <input
                value={values.familyName}
                autoComplete="off"
                onChange={(event) => update('familyName', event.target.value)}
              />
              <small className="invite-form__hint">{t('admin.invites.familyNameHint')}</small>
            </label>
            <label className="invite-form__field">
              <span>{t('admin.invites.partySizeLabel')}</span>
              <input
                inputMode="numeric"
                value={values.partySize}
                aria-invalid={Boolean(errors.partySize)}
                onChange={(event) => update('partySize', event.target.value)}
              />
              {errorText('partySize') ? <small>{errorText('partySize')}</small> : null}
            </label>
          </>
        ) : null}

        {message ? (
          <p className="invite-form__message" role="alert">
            {message}
          </p>
        ) : null}

        <div className="admin-modal__actions">
          <button type="submit" className="obw-portal-btn" disabled={saving}>
            {saving ? t('admin.invites.saving') : t('admin.invites.save')}
          </button>
          <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
