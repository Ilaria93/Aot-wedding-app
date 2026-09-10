import type { ComponentType } from 'react';
import './styles/StatCards.scss';

export type StatCardTone = 'gold' | 'bone' | 'stone';

type StatCardIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;

export type StatCardData = {
  id: string;
  tone: StatCardTone;
  label: string;
  value: number;
  unit?: string;
  /** Shown right after the value instead of a text unit (e.g. a photo icon after a count). */
  valueIcon?: StatCardIcon;
  subtitle?: string;
  /** 0-100 — renders a progress bar instead of the subtitle line (e.g. storage used). */
  progress?: number;
  icon?: StatCardIcon;
  /** Suppresses the icon/dot in the head, leaving just the label. */
  hideIndicator?: boolean;
};

type StatCardsProps = {
  cards: StatCardData[];
};

// Compact metric cards portaled next to the admin hero title (see
// AdminHeroStatsSlotContext) — same card, same size, for every admin section.
// Each card is always sized as 1 of 4 slots (AdminRsvpPage's count, the
// reference layout) and the row is right-aligned, so a page with fewer
// cards (e.g. AdminContactsPage's 2) still gets same-size cards, flush
// with the right edge next to the hero title, instead of stretching wider.
export function StatCards({ cards }: StatCardsProps) {
  return (
    <div className="stat-cards">
      {cards.map((card) => (
        <div key={card.id} className={`stat-card stat-card--${card.tone}`}>
          <div className="stat-card__head">
            <span className="stat-card__label">{card.label}</span>
            {card.hideIndicator ? null : card.icon ? (
              <card.icon size={16} aria-hidden />
            ) : (
              <span className="stat-card__dot" aria-hidden />
            )}
          </div>
          <p className="stat-card__value">
            {card.value}
            {card.valueIcon ? <card.valueIcon size={16} aria-hidden /> : null}
            {card.unit ? <span className="stat-card__unit">{card.unit}</span> : null}
          </p>
          {card.progress !== undefined ? (
            <div className="stat-card__progress-track">
              <div className="stat-card__progress-fill" style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }} />
            </div>
          ) : card.subtitle ? (
            <p className="stat-card__subtitle">{card.subtitle}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
