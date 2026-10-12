import { Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import {
  changeInviteHead,
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
  emptyMemberRow,
  memberRowToForm,
  validateInviteForm,
  type GroupMemberRow,
  type InviteFormField,
  type InviteFormValues,
} from './inviteForm';

const RELATIONS: Relation[] = ['spouse', 'partner', 'child', 'other'];

/** What the dialog is for: a new person (maybe prefilled or pre-linked) or an edit. */
export type PersonDialogMode =
  | { kind: 'add'; prefill?: Partial<InviteFormValues> }
  /** `members`: when editing a head, the rest of the group is edited (and added to) in the same dialog. */
  | { kind: 'edit'; values: InviteFormValues; personId: number; members?: GroupMemberRow[] };

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
  const [memberRows, setMemberRows] = useState<GroupMemberRow[]>(mode.kind === 'edit' ? (mode.members ?? []) : []);
  const [memberErrors, setMemberErrors] = useState<Partial<Record<InviteFormField, string>>[]>([]);
  const editsGroup = mode.kind === 'edit' && mode.members !== undefined;
  // Who receives the invite: the current head unless the admin picks someone else from the group.
  const [newHeadId, setNewHeadId] = useState<number>(mode.kind === 'edit' ? mode.personId : 0);

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

  function updateMember(index: number, patch: Partial<GroupMemberRow>) {
    setMemberRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save(confirmDuplicate: boolean) {
    setMessage(null);
    const found = validateInviteForm(values);
    setErrors(found);
    const foundMembers = memberRows.map((row) => validateInviteForm(memberRowToForm(row, mode.kind === 'edit' ? mode.personId : 0)));
    setMemberErrors(foundMembers);
    if (Object.keys(found).length > 0 || foundMembers.some((errs) => Object.keys(errs).length > 0)) return;

    setSaving(true);
    try {
      if (mode.kind === 'edit') {
        const { head_id: _head, ...changes } = buildCreatePayload(values);
        await updateInvite(mode.personId, changes);
        const rows = [...memberRows];
        for (let index = 0; index < rows.length; index += 1) {
          const payload = buildCreatePayload(memberRowToForm(rows[index], mode.personId));
          if (rows[index].id !== null) {
            const { head_id: _memberHead, ...memberChanges } = payload;
            await updateInvite(rows[index].id as number, memberChanges);
          } else {
            const updatedHead = await createInvite(payload, confirmDuplicate);
            // The newest person of the group is the one just added. Remember its id: if a later row fails
            // and the admin saves again, this one is updated instead of created twice.
            rows[index] = { ...rows[index], id: updatedHead.members[updatedHead.members.length - 1].id };
            setMemberRows([...rows]);
          }
        }
        // Last, once everyone's data is saved: the roles swap and the ids of head and member trade places.
        if (newHeadId !== mode.personId) await changeInviteHead(mode.personId, newHeadId);
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
          {!isEdit || memberRows.some((row) => row.id === null) ? (
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
              <span>{t('admin.invites.partySizeLabel')}</span>
              <select
                value={values.partySize}
                aria-invalid={Boolean(errors.partySize)}
                onChange={(event) => update('partySize', event.target.value)}>
                <option value="">{t('admin.invites.partySizeAuto')}</option>
                {Array.from({ length: 10 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <small className="invite-form__hint">{t('admin.invites.partySizeHint')}</small>
              {errorText('partySize') ? <small>{errorText('partySize')}</small> : null}
            </label>
            <label className="invite-form__field">
              <span>{t('admin.invites.familyName')}</span>
              <input
                value={values.familyName}
                autoComplete="off"
                onChange={(event) => update('familyName', event.target.value)}
              />
              <small className="invite-form__hint">{t('admin.invites.familyNameHint')}</small>
            </label>
          </>
        ) : null}

        {editsGroup ? (
          <div className="invite-form__group">
            <p className="obw-portal-kicker">{t('admin.invites.groupTitle')}</p>
            {memberRows.some((row) => row.id !== null) ? (
              <label className="invite-form__field">
                <span>{t('admin.invites.headChoice')}</span>
                <select value={newHeadId} onChange={(event) => setNewHeadId(Number(event.target.value))}>
                  <option value={mode.kind === 'edit' ? mode.personId : 0}>
                    {values.firstName} {values.lastName}
                  </option>
                  {memberRows
                    .filter((row) => row.id !== null)
                    .map((row) => (
                      <option key={row.id} value={row.id as number}>
                        {row.firstName} {row.lastName}
                      </option>
                    ))}
                </select>
                <small className="invite-form__hint">{t('admin.invites.headChoiceHint')}</small>
              </label>
            ) : null}
            {memberRows.map((row, index) => {
              const rowErrors = memberErrors[index] ?? {};
              return (
                <div className="invite-form__member" key={row.id ?? `new-${index}`}>
                  <div className="invite-form__row">
                    <label className="invite-form__field">
                      <span>{t('admin.invites.firstName')}</span>
                      <input
                        value={row.firstName}
                        aria-invalid={Boolean(rowErrors.firstName)}
                        autoComplete="off"
                        onChange={(event) => updateMember(index, { firstName: event.target.value })}
                      />
                    </label>
                    <label className="invite-form__field">
                      <span>{t('admin.invites.lastName')}</span>
                      <input
                        value={row.lastName}
                        aria-invalid={Boolean(rowErrors.lastName)}
                        autoComplete="off"
                        onChange={(event) => updateMember(index, { lastName: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="invite-form__row">
                    <label className="invite-form__field">
                      <span>{t('admin.invites.phone')}</span>
                      <input
                        type="tel"
                        value={row.phone}
                        aria-invalid={Boolean(rowErrors.phone)}
                        autoComplete="off"
                        onChange={(event) => updateMember(index, { phone: event.target.value })}
                      />
                      {rowErrors.phone ? <small>{t('admin.invites.errorPhone')}</small> : null}
                    </label>
                    <label className="invite-form__field">
                      <span>{t('admin.invites.relationLabel')}</span>
                      <select
                        value={row.relation}
                        aria-invalid={Boolean(rowErrors.relation)}
                        onChange={(event) => updateMember(index, { relation: event.target.value as GroupMemberRow['relation'] })}>
                        <option value="">{t('admin.invites.relationPlaceholder')}</option>
                        {RELATIONS.map((relation) => (
                          <option key={relation} value={relation}>
                            {t(RELATION_KEYS[relation])}
                          </option>
                        ))}
                      </select>
                      {rowErrors.relation ? <small>{t('admin.invites.errorRequired')}</small> : null}
                    </label>
                  </div>
                  {row.id === null ? (
                    <button
                      type="button"
                      className="obw-portal-btn obw-portal-btn--secondary invite-form__remove"
                      aria-label={t('admin.invites.removeRow')}
                      title={t('admin.invites.removeRow')}
                      onClick={() => setMemberRows((rows) => rows.filter((_, i) => i !== index))}>
                      <Trash2 size={16} aria-hidden />
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary"
              onClick={() => setMemberRows((rows) => [...rows, emptyMemberRow(values.lastName)])}>
              <UserPlus size={14} aria-hidden />
              {t('admin.invites.addPerson')}
            </button>
          </div>
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
