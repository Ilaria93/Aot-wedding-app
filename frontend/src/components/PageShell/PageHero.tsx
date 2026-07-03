import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  subtitleFlush?: boolean;
  children?: ReactNode;
};

/** Dark hero band for stack pages (album, travel, admin). */
export function PageHero({ eyebrow, title, subtitle, subtitleFlush = false, children }: PageHeroProps) {
  return (
    <div className="obw-page-hero">
      <p className="obw-kicker obw-kicker--light">{eyebrow}</p>
      <h1 className="obw-display obw-display--light">{title}</h1>
      {subtitle ? (
        <p className={`obw-body${subtitleFlush ? ' obw-body--flush' : ''}`}>{subtitle}</p>
      ) : null}
      {children}
    </div>
  );
}
