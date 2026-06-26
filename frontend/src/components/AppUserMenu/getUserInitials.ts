/** Builds two-letter initials from a user's first and last name. */
export function getUserInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();

  return initials || '?';
}
