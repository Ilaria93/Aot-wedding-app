import type { CreateInvitePayload, Gender, Relation } from '@/services/adminInvitesApi';

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
  if (!values.lastName.trim()) errors.lastName = 'required';
  if (values.phone.trim() && !isPlausiblePhone(values.phone.trim())) errors.phone = 'phoneInvalid';
  if (values.role === 'member') {
    if (values.headId === null) errors.headId = 'required';
    if (!values.relation) errors.relation = 'required';
  } else if (values.partySize.trim() && !/^[1-9][0-9]*$/.test(values.partySize.trim())) {
    errors.partySize = 'partySizeInvalid';
  }
  return errors;
}

const orNull = (value: string) => value.trim() || null;

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
