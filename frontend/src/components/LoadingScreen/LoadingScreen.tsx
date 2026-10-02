type LoadingScreenProps = {
  label: string;
  /** Covers the whole viewport, chrome included — for waits inside a page that already has a header. */
  overlay?: boolean;
};

/** Full-viewport wait state — the couple's crest instead of a spinner. */
export function LoadingScreen({ label, overlay = false }: LoadingScreenProps) {
  return (
    <div className={`loading-screen${overlay ? ' loading-screen--overlay' : ''}`} role="status" aria-live="polite">
      <img
        className="loading-screen__crest"
        src="/assets/wedding/stemma.webp"
        alt=""
        width={420}
        height={495}
        decoding="async"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
