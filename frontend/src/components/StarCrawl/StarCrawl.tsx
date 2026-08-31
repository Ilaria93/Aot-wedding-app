import type { CSSProperties } from 'react';

import './styles/StarCrawl.scss';

type StarCrawlProps = {
  lines: string[];
  title?: string;
  durationSeconds?: number;
};

/**
 * Full-screen text crawl: scrolls upward while a fixed 3D tilt makes it
 * shrink toward the horizon, same mechanic as the Star Wars opening crawl —
 * dressed in the site's own palette/type instead of a starfield. Not wired
 * into any real page yet, see docs/deferred/star-crawl.md.
 */
export function StarCrawl({ lines, title, durationSeconds = 32 }: StarCrawlProps) {
  const style = { '--star-crawl-duration': `${durationSeconds}s` } as CSSProperties;

  return (
    <div className="star-crawl" style={style}>
      <div className="star-crawl__viewport">
        <div className="star-crawl__text">
          {title ? <h1 className="star-crawl__title">{title}</h1> : null}
          {lines.map((line, index) => (
            <p key={index} className="star-crawl__line">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
