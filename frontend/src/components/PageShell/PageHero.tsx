import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  subtitleFlush?: boolean;
  children?: ReactNode;
};

/** Hero card with eyebrow, title and optional subtitle/actions. */
export function PageHero({ eyebrow, title, subtitle, subtitleFlush = false, children }: PageHeroProps) {
  return (
    <div className="hero-card">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="title">{title}</h1>
      {subtitle ? (
        <p className={`subtitle${subtitleFlush ? ' subtitle--flush' : ''}`}>{subtitle}</p>
      ) : null}
      {children}
    </div>
  );
}
