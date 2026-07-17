import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';

export type RsvpGuestFieldError = {
  clientId: string;
  field: 'first_name' | 'last_name' | 'dietary_notes';
  messageKey: 'rsvp.validation.firstNameRequired' | 'rsvp.validation.lastNameRequired' | 'rsvp.validation.otherNotesRequired';
};

/** Validates guest rows before RSVP submit; returns field-level errors for inline display. */
export function validateRsvpGuestLines(guests: RsvpGuestDraft[]): RsvpGuestFieldError[] {
  const errors: RsvpGuestFieldError[] = [];

  for (const guest of guests) {
    if (!guest.isAccountHolder && !guest.first_name.trim()) {
      errors.push({
        clientId: guest.clientId,
        field: 'first_name',
        messageKey: 'rsvp.validation.firstNameRequired',
      });
    }

    if (!guest.isAccountHolder && !guest.last_name.trim()) {
      errors.push({
        clientId: guest.clientId,
        field: 'last_name',
        messageKey: 'rsvp.validation.lastNameRequired',
      });
    }

    if (guest.intolerance === 'other' && !guest.dietary_notes.trim()) {
      errors.push({
        clientId: guest.clientId,
        field: 'dietary_notes',
        messageKey: 'rsvp.validation.otherNotesRequired',
      });
    }
  }

  return errors;
}
