import type { ComponentType } from 'react';
import './styles/StatCards.scss';

export type StatCardTone = 'gold' | 'bone' | 'stone';

export type StatCardData = {
  id: string;
  tone: StatCardTone;
  label: string;
  value: number;
  unit?: string;
  subtitle?: string;
  icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
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
            {card.icon ? <card.icon size={16} aria-hidden /> : <span className="stat-card__dot" aria-hidden />}
          </div>
          <p className="stat-card__value">
            {card.value}
            {card.unit ? <span className="stat-card__unit">{card.unit}</span> : null}
          </p>
          {card.subtitle ? <p className="stat-card__subtitle">{card.subtitle}</p> : null}
        </div>
      ))}
    </div>
  );
}
