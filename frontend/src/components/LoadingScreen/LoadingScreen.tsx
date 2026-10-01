type LoadingScreenProps = {
  label: string;
};

/** Full-viewport wait state — the couple's crest instead of a spinner. */
export function LoadingScreen({ label }: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
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
