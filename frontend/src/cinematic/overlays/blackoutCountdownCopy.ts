type CountdownUnitLabels = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function padCountdownUnit(value: number): string {
  return String(value).padStart(2, '0');
}

/** Builds the two-line uppercase countdown copy for the cinematic blackout finale. */
export function buildBlackoutCountdownLines(
  parts: { days: number; hours: number; minutes: number; seconds: number },
  labels: CountdownUnitLabels,
): { firstLine: string; secondLine: string } {
  return {
    firstLine: `${parts.days} ${labels.days} ${padCountdownUnit(parts.hours)} ${labels.hours}`,
    secondLine: `${padCountdownUnit(parts.minutes)} ${labels.minutes} ${padCountdownUnit(parts.seconds)} ${labels.seconds}`,
  };
}
