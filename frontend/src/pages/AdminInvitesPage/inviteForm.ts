import type { CreateInvitePayload, Gender, InviteMember, Relation } from '@/services/adminInvitesApi';

export type InviteFormValues = {
  firstName: string;
  lastName: string;
  gender: '' | Gender;
  phone: string;
  /** "head" receives the invite; "member" is linked to a head. */
  role: 'head' | 'member';
  headId: number | null;
  relation: '' | Relation;
  familyName: string;
  partySize: string;
};

export type InviteFormField = 'firstName' | 'lastName' | 'phone' | 'headId' | 'relation' | 'partySize';
export type InviteFormError = 'required' | 'phoneInvalid' | 'partySizeInvalid';

export const EMPTY_INVITE_FORM: InviteFormValues = {
  firstName: '',
  lastName: '',
  gender: '',
  phone: '',
  role: 'head',
  headId: null,
  relation: '',
  familyName: '',
  partySize: '',
};

/** Digits, spaces and phone punctuation, optional leading +, 8–15 actual digits (E.164 max). */
function isPlausiblePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return /^\+?[0-9\s().-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15;
}

/** Client-side check before sending; the backend validates (and normalises the phone) again. */
export function validateInviteForm(values: InviteFormValues): Partial<Record<InviteFormField, InviteFormError>> {
  const errors: Partial<Record<InviteFormField, InviteFormError>> = {};
  if (!values.firstName.trim()) errors.firstName = 'required';
  // A person linked to a group may have only a first name (the head receives the invite).
  if (values.role !== 'member' && !values.lastName.trim()) errors.lastName = 'required';
  if (values.phone.trim() && !isPlausiblePhone(values.phone.trim())) errors.phone = 'phoneInvalid';
  if (values.role === 'member') {
    if (values.headId === null) errors.headId = 'required';
    if (!values.relation) errors.relation = 'required';
  } else if (values.partySize.trim() && !/^([1-9]|10)$/.test(values.partySize.trim())) {
    // 10 is the most one invite can answer for (MAX_PARTY_GUESTS in the backend).
    errors.partySize = 'partySizeInvalid';
  }
  return errors;
}

const orNull = (value: string) => value.trim() || null;

/** One person of the group as the edit dialog shows them: `id` is null until a newly added row is saved. */
export type GroupMemberRow = {
  id: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  /** Not editable here, but kept so saving a row never wipes it. */
  gender: '' | Gender;
  relation: '' | Relation;
  /** Set on a row that links a person already in the table (their id, 0 until chosen): no new person is created. */
  linkFrom?: number;
};

export function memberRowFromMember(member: InviteMember): GroupMemberRow {
  return {
    id: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    phone: member.phone ?? '',
    gender: member.gender ?? '',
    relation: member.relation,
  };
}

/** A blank row for "add person": same surname as the head, the relation still to choose. */
export function emptyMemberRow(headLastName: string): GroupMemberRow {
  return { id: null, firstName: '', lastName: headLastName, phone: '', gender: '', relation: '' };
}

/** A row to link someone already in the table: the person is picked from a list, then their relation. */
export function emptyLinkRow(): GroupMemberRow {
  return { id: null, firstName: '', lastName: '', phone: '', gender: '', relation: '', linkFrom: 0 };
}

/** The member row as the regular form values, so it is validated and sent like any linked person. */
export function memberRowToForm(row: GroupMemberRow, headId: number): InviteFormValues {
  return { ...EMPTY_INVITE_FORM, firstName: row.firstName, lastName: row.lastName, phone: row.phone, gender: row.gender, role: 'member', headId, relation: row.relation };
}

export function buildCreatePayload(values: InviteFormValues): CreateInvitePayload {
  const isMember = values.role === 'member';
  return {
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    gender: values.gender || null,
    phone: orNull(values.phone),
    head_id: isMember ? values.headId : null,
    relation: isMember ? values.relation || null : null,
    // Family name and party size belong to the head.
    family_name: isMember ? null : orNull(values.familyName),
    party_size: !isMember && values.partySize.trim() ? Number(values.partySize.trim()) : null,
  };
}

/**
 * The prefill carried by the Telegram link (`/admin/invites?add=1&first_name=…`):
 * null when the link is not an "add" link or carries no name.
 */
export function parseAddParams(search: string): Pick<InviteFormValues, 'firstName' | 'lastName' | 'phone'> | null {
  const params = new URLSearchParams(search);
  if (params.get('add') !== '1') return null;
  const firstName = params.get('first_name')?.trim() ?? '';
  const lastName = params.get('last_name')?.trim() ?? '';
  if (!firstName && !lastName) return null;
  return { firstName, lastName, phone: params.get('phone')?.trim() ?? '' };
}

export const RELATION_KEYS = {
  spouse: 'admin.invites.relationSpouse',
  partner: 'admin.invites.relationPartner',
  child: 'admin.invites.relationChild',
  other: 'admin.invites.relationOther',
} as const;
