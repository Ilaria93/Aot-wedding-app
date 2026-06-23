/** AoT-inspired wedding seal for the mission document hero. */
export function MissionDocumentSeal() {
  return (
    <svg className="mission-hero__seal" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="0.5" />
      <path
        d="M32 8 L36 20 L48 20 L38 28 L42 40 L32 32 L22 40 L26 28 L16 20 L28 20 Z"
        stroke="currentColor"
        strokeWidth="0.75"
      />
    </svg>
  );
}
