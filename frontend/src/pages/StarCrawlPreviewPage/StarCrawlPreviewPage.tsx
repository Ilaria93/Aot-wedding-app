import { StarCrawl } from '@/components/StarCrawl/StarCrawl';

// Placeholder copy only — swap once there's an actual decision on content.
// See docs/deferred/star-crawl.md.
const PLACEHOLDER_LINES = [
  'Molto tempo fa, in una città non troppo lontana...',
  'Ilaria e Davide hanno deciso di unirsi in matrimonio.',
  'Amici e famiglia sono invitati a raggiungerli per celebrare insieme questo giorno.',
];

/** Dev-only preview for the StarCrawl component — not linked from the real site. */
export function StarCrawlPreviewPage() {
  return <StarCrawl title="Ilaria & Davide" lines={PLACEHOLDER_LINES} />;
}
