import { Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Lightbox, type LightboxItem } from '@/components/Lightbox';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslateFn } from '@/i18n/translations';
import './styles/LandingStorySection.scss';

/** The two recruits: name, portrait and their enlistment dossier. */
const RECRUITS = [
  { id: 'davide', name: 'Davide', src: '/assets/wedding/davide.webp', roleKey: 'landing.story.groomCaption' },
  { id: 'ilaria', name: 'Ilaria', src: '/assets/wedding/ilaria.webp', roleKey: 'landing.story.brideCaption' },
] as const;

const DOSSIER_FIELDS = ['codename', 'enlisted', 'rank', 'specialty', 'weakness', 'weapon', 'quote'] as const;

const CREST_SRC = '/assets/wedding/stemma.webp';

type StageKey = 'contact' | 'enlist' | 'battles' | 'proposal' | 'final';
type PhotoKey =
  | 'band' | 'crowd' | 'stage' | 'lineup' | 'rehearsal' | 'bassline' | 'bandmates'
  | 'tavern' | 'lookout' | 'secret' | 'paris'
  | 'vader' | 'boat' | 'assisi' | 'bridge' | 'sunset' | 'fireplace'
  | 'moto' | 'paestum' | 'costumes' | 'procida' | 'kayak' | 'silly' | 'snow' | 'arch'
  | 'monument' | 'amarissimo';
type PendingKey = 'dog' | 'house';

type Stage = {
  key: StageKey;
  number: string;
  /** Photo files in /assets/wedding/story; the first is the cover. */
  photos: PhotoKey[];
  /** Photos still to come: shown as crest placeholders until the real file exists. */
  pending?: PendingKey[];
};

/** The story as five mission reports, in order. Add a photo = add its key here. */
const STAGES: Stage[] = [
  {
    key: 'contact',
    number: '001',
    photos: ['band', 'rehearsal', 'stage', 'lineup', 'bassline', 'crowd', 'bandmates'],
  },
  {
    key: 'enlist',
    number: '002',
    photos: ['bridge', 'vader', 'boat', 'assisi', 'sunset', 'fireplace', 'tavern', 'lookout', 'secret', 'paris'],
  },
  {
    key: 'battles',
    number: '003',
    photos: ['silly', 'moto', 'paestum', 'costumes', 'procida', 'kayak', 'snow', 'arch'],
    pending: ['dog', 'house'],
  },
  { key: 'proposal', number: '004', photos: ['monument'] },
  { key: 'final', number: '005', photos: ['amarissimo'] },
];

function stageLightboxItems(stage: Stage, t: TranslateFn): LightboxItem[] {
  const photos = stage.photos.map((photo) => ({
    src: `/assets/wedding/story/${photo}.webp`,
    alt: t(`landing.story.photos.${photo}`),
    caption: t(`landing.story.photos.${photo}`),
  }));
  const pending = (stage.pending ?? []).map((photo) => ({
    src: CREST_SRC,
    alt: t(`landing.story.pending.${photo}`),
    caption: `${t(`landing.story.pending.${photo}`)} — ${t('landing.story.pendingLabel')}`,
  }));
  return [...photos, ...pending];
}

/** Adds `is-visible` to each observed element the first time it scrolls into view. */
function useRevealOnScroll() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = rootRef.current?.querySelectorAll('[data-reveal]');
    if (!items) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return rootRef;
}

type StageCardProps = {
  stage: Stage;
  onOpen: (stage: Stage) => void;
};

/** One mission report: cover (photo, crest or placeholder) plus its text. */
function StageCard({ stage, onOpen }: StageCardProps) {
  const { t } = useI18n();
  const itemCount = stage.photos.length + (stage.pending?.length ?? 0);
  const cover = stage.photos[0];

  return (
    <article className="obw-card obw-card--dark landing-story__stage-card">
      <div className="obw-card__texture" aria-hidden="true" />

      <div className="landing-story__stage-cover">
        {cover ? (
          <button type="button" className="landing-story__stage-open" onClick={() => onOpen(stage)}>
            <img src={`/assets/wedding/story/${cover}.webp`} alt={t(`landing.story.photos.${cover}`)} loading="lazy" />
            {itemCount > 1 ? (
              <span className="landing-story__stage-count">
                <Images size={14} aria-hidden />
                {itemCount}
              </span>
            ) : null}
          </button>
        ) : stage.key === 'final' ? (
          <div className="landing-story__stage-crest">
            <img src={CREST_SRC} alt="" loading="lazy" />
          </div>
        ) : (
          <div className="landing-story__stage-pending">
            <img src={CREST_SRC} alt="" loading="lazy" />
            <span>{t('landing.story.pendingLabel')}</span>
          </div>
        )}
      </div>

      <div className="landing-story__stage-body">
        <p className="landing-story__stage-meta">
          {t('landing.story.reportLabel')} {stage.number} · {t(`landing.story.stages.${stage.key}.date`)}
        </p>
        <h3 className="obw-display landing-story__stage-title">{t(`landing.story.stages.${stage.key}.title`)}</h3>
        <p className="obw-body obw-body--flush">{t(`landing.story.stages.${stage.key}.body`)}</p>
      </div>
    </article>
  );
}

/**
 * Landing story section: the two recruits, each with their enlistment dossier,
 * then the story as a mission timeline. Their two lines run either side of the
 * first report (2011, still separate paths) and merge into one at the second
 * (2019, "their paths finally joined").
 */
export function LandingStorySection() {
  const { t } = useI18n();
  const journeyRef = useRevealOnScroll();
  const [openStage, setOpenStage] = useState<Stage | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [firstStage, ...laterStages] = STAGES;

  function openStagePhotos(stage: Stage) {
    setOpenStage(stage);
    setOpenIndex(0);
  }

  return (
    <section className="obw-section obw-fade-up landing-story" id="story">
      <div className="obw-container landing-story__inner">
        <header className="landing-story__head">
          <h2 className="obw-display obw-display--lg">{t('landing.story.heading')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>

        <div className="landing-story__journey" ref={journeyRef}>
          {/* Same card as the mission reports below, so the whole section reads as one set. */}
          <div className="landing-story__recruits">
            {RECRUITS.map((recruit) => (
              <article
                key={recruit.id}
                className="obw-card obw-card--dark landing-story__stage-card landing-story__recruit">
                <div className="obw-card__texture" aria-hidden="true" />
                <div className="landing-story__stage-cover">
                  <img className="landing-story__recruit-portrait" src={recruit.src} alt={recruit.name} loading="lazy" />
                </div>
                <div className="landing-story__stage-body">
                  <p className="landing-story__stage-meta">
                    {t(recruit.roleKey)} · {t('landing.story.dossier.title')}
                  </p>
                  <dl className="landing-story__dossier-fields">
                    <div className="landing-story__dossier-field">
                      <dt>{t('landing.story.dossier.labels.name')}</dt>
                      <dd>{recruit.name}</dd>
                    </div>
                    {DOSSIER_FIELDS.map((field) => (
                      <div key={field} className="landing-story__dossier-field">
                        <dt>{t(`landing.story.dossier.labels.${field}`)}</dt>
                        <dd>{t(`landing.story.dossier.${recruit.id}.${field}`)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>

          <div className="landing-story__fork" data-reveal>
            <span className="landing-story__stage-dot" aria-hidden="true" />
            <StageCard stage={firstStage} onOpen={openStagePhotos} />
            <svg className="landing-story__merge" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M25 0 C25 24 50 16 50 40" pathLength="1" />
              <path d="M75 0 C75 24 50 16 50 40" pathLength="1" />
            </svg>
          </div>

          <ol className="landing-story__timeline">
            {laterStages.map((stage) => (
              <li key={stage.key} className="landing-story__stage" data-reveal>
                <span className="landing-story__stage-dot" aria-hidden="true" />
                <StageCard stage={stage} onOpen={openStagePhotos} />
              </li>
            ))}
          </ol>
        </div>

        <Lightbox
          items={openStage ? stageLightboxItems(openStage, t) : []}
          openIndex={openIndex}
          onChange={setOpenIndex}
        />
      </div>
    </section>
  );
}
