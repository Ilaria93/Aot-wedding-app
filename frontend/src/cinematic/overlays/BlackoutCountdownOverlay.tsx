import { formatCountdownVenueLine } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { useWeddingCountdown } from '@/hooks/useWeddingCountdown';
import { buildBlackoutCountdownLines } from '@/cinematic/overlays/blackoutCountdownCopy';
import { WingsOfFreedomEmblem } from '@/cinematic/overlays/WingsOfFreedomEmblem';

import './styles/BlackoutCountdownOverlay.scss';

type BlackoutCountdownOverlayProps = {
  visible: boolean;
  blackoutOpacity: number;
  metaOpacity: number;
  countdownOpacity: number;
};

function padCountdownUnit(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Fullscreen blackout finale with Wings of Freedom emblem and metallic live countdown (web only).
 */
export function BlackoutCountdownOverlay({
  visible,
  blackoutOpacity,
  countdownOpacity,
}: BlackoutCountdownOverlayProps) {
  const { t } = useI18n();
  const countdown = useWeddingCountdown();

  if (!visible || blackoutOpacity <= 0) {
    return null;
  }

  const venueLine = formatCountdownVenueLine();
  const lines = buildBlackoutCountdownLines(countdown, {
    days: t('landing.cinematic.countdownUnitDays'),
    hours: t('landing.cinematic.countdownUnitHours'),
    minutes: t('landing.cinematic.countdownUnitMinutes'),
    seconds: t('landing.cinematic.countdownUnitSeconds'),
  });
  const liveSummary = t('landing.cinematic.countdownLiveSummary', {
    days: padCountdownUnit(countdown.days),
    hours: padCountdownUnit(countdown.hours),
    minutes: padCountdownUnit(countdown.minutes),
    seconds: padCountdownUnit(countdown.seconds),
  });

  const contentOpacity = Math.max(countdownOpacity, 0);

  return (
    <section
      className="blackout-countdown"
      aria-label={t('landing.cinematic.countdownOverlayLabel')}
      style={{ backgroundColor: `rgba(0, 0, 0, ${blackoutOpacity})` }}>
      <WingsOfFreedomEmblem
        className="blackout-countdown__emblem"
        style={{ opacity: contentOpacity * 0.22 }}
      />
      {contentOpacity > 0 ? (
        <div className="blackout-countdown__content" style={{ opacity: contentOpacity }}>
          <div
            role="timer"
            aria-live="polite"
            aria-atomic
            aria-label={liveSummary}>
            <p className="blackout-countdown__line" aria-hidden>
              {lines.firstLine}
            </p>
            <p className="blackout-countdown__line" aria-hidden>
              {lines.secondLine}
            </p>
          </div>
          <p className="blackout-countdown__venue">{venueLine}</p>
        </div>
      ) : null}
    </section>
  );
}
